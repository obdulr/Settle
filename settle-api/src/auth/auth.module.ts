import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { WebAuthnService } from './webauthn.service';
import { WebAuthnController } from './webauthn.controller';
import { TelnyxService } from './telnyx.service';
import { SmsAuthService } from './sms-auth.service';
import { SmsAuthController } from './sms-auth.controller';
import { User } from '../entities/user.entity';
import { Provider } from '../entities/provider.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { ActivitiesModule } from '../activities/activities.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Provider]),
    PassportModule,
    ActivitiesModule,
    EmailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET') || (process.env.NODE_ENV === 'production' ? (() => { throw new Error('JWT_SECRET must be set in production'); })() : 'dev-only-not-for-production-use'),
        signOptions: {
          expiresIn: '30d',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, WebAuthnController, SmsAuthController],
  providers: [AuthService, JwtStrategy, LocalStrategy, WebAuthnService, TelnyxService, SmsAuthService],
  exports: [AuthService],
})
export class AuthModule {}
