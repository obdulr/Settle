import { Controller, Post, Delete, Body, UseGuards, Request } from '@nestjs/common';
import { WebAuthnService } from './webauthn.service';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth/passkey')
export class WebAuthnController {
  constructor(
    private webauthnService: WebAuthnService,
    private authService: AuthService,
  ) {}

  // Step 1: Get registration options (requires auth — user must be logged in to add a passkey)
  @UseGuards(JwtAuthGuard)
  @Post('register/options')
  async registerOptions(@Request() req) {
    return this.webauthnService.generateRegistrationOptions(req.user.sub, req.user.email);
  }

  // Step 2: Verify registration response (requires auth)
  @UseGuards(JwtAuthGuard)
  @Post('register/verify')
  async registerVerify(@Request() req, @Body() body: { credential: any; challenge: string }) {
    return this.webauthnService.verifyRegistration(req.user.sub, body.credential, body.challenge);
  }

  // Step 1: Get authentication options (no auth required — user is trying to log in)
  @Post('authenticate/options')
  async authOptions(@Body() body: { email?: string }) {
    return this.webauthnService.generateAuthenticationOptions(body.email);
  }

  // Step 2: Verify authentication response and issue JWT
  @Post('authenticate/verify')
  async authVerify(@Body() body: { email: string; credential: any; challenge: string }) {
    const result = await this.webauthnService.verifyAuthentication(
      body.email,
      body.credential,
      body.challenge,
    );

    if (!result.verified || !result.user) {
      return { success: false, error: result.error || 'Passkey verification failed' };
    }

    // Issue JWT tokens
    const tokens = await this.authService.generateTokensForUser(result.user);
    return {
      success: true,
      ...tokens,
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        phone: result.user.phone,
        createdAt: result.user.createdAt,
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete()
  async deletePasskey(@Request() req) {
    return { success: await this.webauthnService.deletePasskey(req.user.sub) };
  }
}
