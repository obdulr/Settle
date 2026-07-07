import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { User } from '../entities/user.entity';

@Injectable()
export class WebAuthnService {
  private readonly logger = new Logger(WebAuthnService.name);
  private challenges: Map<string, string> = new Map();

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  private get rpID(): string {
    if (process.env.WEB_AUTHN_RP_ID) return process.env.WEB_AUTHN_RP_ID;
    return process.env.NODE_ENV === 'production'
      ? 'settleinpeace.com'
      : 'localhost';
  }

  private get origin(): string {
    if (process.env.WEB_AUTHN_ORIGIN) return process.env.WEB_AUTHN_ORIGIN;
    return process.env.NODE_ENV === 'production'
      ? 'https://www.settleinpeace.com'
      : 'http://localhost:3025';
  }

  async generateRegistrationOptions(userId: string, email: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const options = await generateRegistrationOptions({
      rpName: 'Settle In Peace',
      rpID: this.rpID,
      userID: new TextEncoder().encode(userId),
      userName: email,
      attestationType: 'none',
      authenticatorSelection: {
        userVerification: 'preferred',
        requireResidentKey: false,
      },
    });

    this.challenges.set(userId, options.challenge);
    return options;
  }

  async verifyRegistration(userId: string, credential: any, expectedChallenge: string) {
    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin: this.origin,
      expectedRPID: this.rpID,
    });

    if (verification.verified && verification.registrationInfo) {
      const { credential: cred } = verification.registrationInfo;
      const transports = cred.transports || [];

      await this.usersRepository.update(userId, {
        passkeyCredentialId: cred.id,
        passkeyPublicKey: Buffer.from(cred.publicKey),
        passkeyCounter: cred.counter,
        passkeyTransports: JSON.stringify(transports),
        passkeyVerifiedAt: new Date(),
      });

      this.logger.log(`Passkey registered for user ${userId}`);
    }

    return verification;
  }

  async generateAuthenticationOptions(email?: string) {
    let allowCredentials: any[] = [];

    if (email) {
      const user = await this.usersRepository.findOne({ where: { email } });
      if (user?.passkeyCredentialId) {
        const transports = user.passkeyTransports
          ? JSON.parse(user.passkeyTransports)
          : [];
        allowCredentials = [{
          id: user.passkeyCredentialId,
          transports,
        }];
      }
    }

    const options = await generateAuthenticationOptions({
      rpID: this.rpID,
      allowCredentials,
      userVerification: 'preferred',
    });

    // Store challenge keyed by a temporary session key
    const challengeKey = email || 'anonymous';
    this.challenges.set(challengeKey, options.challenge);
    return options;
  }

  async verifyAuthentication(email: string, credential: any, expectedChallenge: string) {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user || !user.passkeyCredentialId || !user.passkeyPublicKey) {
      return { verified: false, error: 'No passkey registered for this user' };
    }

    const storedChallenge = this.challenges.get(email);
    if (storedChallenge && storedChallenge !== expectedChallenge) {
      // Challenge mismatch
    }

    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin: this.origin,
      expectedRPID: this.rpID,
      credential: {
        id: user.passkeyCredentialId,
        publicKey: new Uint8Array(user.passkeyPublicKey),
        counter: user.passkeyCounter || 0,
      },
    });

    if (verification.verified) {
      await this.usersRepository.update(user.id, {
        passkeyCounter: verification.authenticationInfo.newCounter,
      });
      this.logger.log(`Passkey authentication successful for user ${user.id}`);
    }

    this.challenges.delete(email);
    return { verified: verification.verified, user };
  }

  hasPasskey(userId: string): Promise<boolean> {
    return this.usersRepository.findOne({ where: { id: userId } }).then(
      (u) => !!u?.passkeyCredentialId,
    );
  }

  async deletePasskey(userId: string): Promise<boolean> {
    const result = await this.usersRepository.update(userId, {
      passkeyCredentialId: null,
      passkeyPublicKey: null,
      passkeyCounter: 0,
      passkeyTransports: null,
      passkeyVerifiedAt: null,
    });
    return result.affected > 0;
  }
}
