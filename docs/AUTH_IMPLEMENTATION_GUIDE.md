# Authentication Implementation Guide

This guide provides step-by-step instructions for implementing the standard authentication system across all projects (Settle, Reid, Notyced, Prime).

## Authentication Methods

All projects will support exactly these authentication methods:
1. **Email/Password** - Traditional login
2. **WebAuthn/Passkey** - FIDO2 passkey authentication
3. **SMS/OTP** - Firebase-based phone verification
4. **NO Social Login** - No Google, Facebook, or other social OAuth

## Phase 1: Email/Password Authentication

### Backend Implementation (NestJS)

#### 1. Install Dependencies
```bash
pnpm add @nestjs/jwt @nestjs/passport passport passport-jwt passport-local bcrypt class-validator class-transformer
pnpm add -D @types/passport-jwt @types/passport-local @types/bcrypt
```

#### 2. Create User Entity
```typescript
// src/entities/user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ name: 'password', type: 'varchar', length: 255, nullable: true })
  password: string; // Bcrypt hashed

  @Column({ type: 'varchar', length: 50, default: 'customer', nullable: true })
  role?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name?: string;

  @Column({ length: 20, nullable: true })
  phone?: string;

  // Email verification
  @Column({ name: 'email_verified', type: 'boolean', default: false, nullable: true })
  emailVerified?: boolean;

  @Column({ name: 'email_verification_token', nullable: true })
  emailVerificationToken?: string;

  @Column({ name: 'email_verification_expires', type: 'timestamp', nullable: true })
  emailVerificationExpires?: Date;

  // Phone verification
  @Column({ name: 'phone_verified', type: 'boolean', default: false, nullable: true })
  phoneVerified?: boolean;

  // Security fields
  @Column({ name: 'failed_login_attempts', type: 'int', default: 0, nullable: true })
  failedLoginAttempts?: number;

  @Column({ name: 'last_failed_login_at', type: 'timestamp', nullable: true })
  lastFailedLoginAt?: Date;

  @Column({ name: 'lockout_expires_at', type: 'timestamp', nullable: true })
  lockoutExpiresAt?: Date;

  @Column({ name: 'account_locked', type: 'boolean', default: false, nullable: true })
  accountLocked?: boolean;

  // Password reset
  @Column({ name: 'reset_token', length: 255, nullable: true, select: false })
  resetToken?: string;

  @Column({ name: 'reset_token_expires', type: 'timestamp', nullable: true })
  resetTokenExpires?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

#### 3. Create JWT Strategy
```typescript
// src/auth/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from '../services/user/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    const user = await this.userService.findById(payload.id);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
```

#### 4. Create Local Strategy
```typescript
// src/auth/local.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from './auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string): Promise<any> {
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
```

#### 5. Create Auth Service
```typescript
// src/auth/auth.service.ts
import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../services/user/user.service';
import { User } from '../entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      return null;
    }

    // Check if account is locked
    if (user.accountLocked && user.lockoutExpiresAt && user.lockoutExpiresAt > new Date()) {
      throw new BadRequestException('Account is temporarily locked');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      // Increment failed login attempts
      await this.userService.incrementFailedLoginAttempts(user.id);
      return null;
    }

    // Reset failed login attempts on successful login
    await this.userService.resetFailedLoginAttempts(user.id);
    return user;
  }

  async login(user: any) {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      phone: user.phone,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
      expiresIn: 30 * 24 * 60 * 60, // 30 days
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
      },
    };
  }

  async register(email: string, password: string, name: string, phone?: string) {
    const existingUser = await this.userService.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.userService.create({
      email,
      password: hashedPassword,
      name,
      phone,
    });

    return this.login(user);
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.userService.findById(payload.id);
      if (!user) {
        throw new UnauthorizedException();
      }

      return this.login(user);
    } catch (e) {
      throw new UnauthorizedException();
    }
  }
}
```

#### 6. Create Auth Controller
```typescript
// src/auth/auth.controller.ts
import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() body: { email: string; password: string; name: string; phone?: string }) {
    return this.authService.register(body.email, body.password, body.name, body.phone);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @Post('refresh')
  async refresh(@Body() body: { refreshToken: string }) {
    return this.authService.refreshToken(body.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
      phone: req.user.phone,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout() {
    return { message: 'Logged out successfully' };
  }
}
```

### Frontend Implementation (Next.js)

#### 1. Create Auth Context
```typescript
// contexts/AuthContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createSettleApi } from '@settle/shared-sdk';

interface AuthContextType {
  user: any;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const api = createSettleApi({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    getToken: () => localStorage.getItem('accessToken'),
    onUnauthorized: () => {
      logout();
    },
  });

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.auth.login({ email, password });
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('user', JSON.stringify(response.user));
    setUser(response.user);
  };

  const register = async (email: string, password: string, name: string) => {
    const response = await api.auth.register({ email, password, name });
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('user', JSON.stringify(response.user));
    setUser(response.user);
  };

  const logout = async () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### Mobile Implementation (Expo)

#### 1. Create Auth Service
```typescript
// services/authService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createSettleApi } from '@settle/shared-sdk';

class AuthService {
  private api: any;

  constructor() {
    this.api = createSettleApi({
      baseUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
      getToken: () => this.getToken(),
      onUnauthorized: () => this.logout(),
    });
  }

  async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem('accessToken');
  }

  async setToken(token: string): Promise<void> {
    await AsyncStorage.setItem('accessToken', token);
  }

  async removeToken(): Promise<void> {
    await AsyncStorage.removeItem('accessToken');
  }

  async getUser(): Promise<any> {
    const userData = await AsyncStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  }

  async setUser(user: any): Promise<void> {
    await AsyncStorage.setItem('user', JSON.stringify(user));
  }

  async removeUser(): Promise<void> {
    await AsyncStorage.removeItem('user');
  }

  async login(email: string, password: string): Promise<void> {
    const response = await this.api.auth.login({ email, password });
    await this.setToken(response.accessToken);
    await this.setUser(response.user);
  }

  async register(email: string, password: string, name: string): Promise<void> {
    const response = await this.api.auth.register({ email, password, name });
    await this.setToken(response.accessToken);
    await this.setUser(response.user);
  }

  async logout(): Promise<void> {
    await this.removeToken();
    await this.removeUser();
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }
}

export const authService = new AuthService();
```

## Phase 2: WebAuthn/Passkey Authentication

### Backend Implementation

#### 1. Install Dependencies
```bash
pnpm install @simplewebauthn/server @simplewebauthn/types
```

#### 2. Create Passkey Entity
```typescript
// src/entities/passkey.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('user_passkeys')
export class Passkey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'text', name: 'credential_id' })
  credentialId: string;

  @Column({ type: 'bytea', name: 'public_key' })
  publicKey: Buffer;

  @Column({ type: 'integer', default: 0, name: 'sign_count' })
  signCount: number;

  @Column({ type: 'text', array: true, default: () => 'ARRAY[]::TEXT[]' })
  transports: string[];

  @Column({ type: 'boolean', default: false, name: 'backed_up' })
  backedUp: boolean;

  @Column({ type: 'boolean', default: false, name: 'backup_eligible' })
  backupEligible: boolean;

  @Column({ type: 'text', nullable: true, name: 'device_type' })
  deviceType: string;

  @Column({ type: 'text', default: 'My Passkey' })
  name: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'last_used_at' })
  lastUsedAt: Date;
}
```

#### 3. Create WebAuthn Service
```typescript
// src/auth/webauthn.service.ts
import { Injectable } from '@nestjs/common';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { PasskeyService } from '../services/passkey/passkey.service';

@Injectable()
export class WebAuthnService {
  constructor(private passkeyService: PasskeyService) {}

  async generateRegistrationOptions(userId: string) {
    const userPasskeys = await this.passkeyService.findByUserId(userId);
    
    return generateRegistrationOptions({
      rpName: 'Settle',
      rpID: process.env.WEBAUTHN_RP_ID || 'localhost',
      userID: userId,
      userName: 'user',
      excludeCredentials: userPasskeys.map(passkey => ({
        id: passkey.credentialId,
        transports: passkey.transports,
      })),
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'preferred',
      },
    });
  }

  async verifyRegistration(userId: string, response: any) {
    const verification = await verifyRegistrationResponse({
      response: response,
      expectedChallenge: await this.passkeyService.getChallenge(userId),
      expectedOrigin: process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000',
      expectedRPID: process.env.WEBAUTHN_RP_ID || 'localhost',
    });

    if (verification.verified) {
      await this.passkeyService.create({
        userId,
        credentialId: verification.registrationInfo.credentialID,
        publicKey: Buffer.from(verification.registrationInfo.credentialPublicKey),
        transports: response.response.transports || [],
        signCount: verification.registrationInfo.counter,
        backedUp: verification.registrationInfo.credentialDeviceType === 'singleDevice' ? false : true,
        backupEligible: verification.registrationInfo.credentialDeviceType === 'singleDevice' ? false : true,
        deviceType: verification.registrationInfo.credentialDeviceType,
      });
    }

    return verification;
  }

  async generateAuthenticationOptions(userId: string) {
    const userPasskeys = await this.passkeyService.findByUserId(userId);
    
    return generateAuthenticationOptions({
      rpID: process.env.WEBAUTHN_RP_ID || 'localhost',
      userVerification: 'preferred',
      allowCredentials: userPasskeys.map(passkey => ({
        id: passkey.credentialId,
        transports: passkey.transports,
      })),
    });
  }

  async verifyAuthentication(response: any) {
    const passkey = await this.passkeyService.findByCredentialId(
      response.id
    );

    const verification = await verifyAuthenticationResponse({
      response: response,
      expectedChallenge: await this.passkeyService.getChallenge(passkey.userId),
      expectedOrigin: process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000',
      expectedRPID: process.env.WEBAUTHN_RP_ID || 'localhost',
      authenticator: {
        credentialID: passkey.credentialId,
        credentialPublicKey: passkey.publicKey,
        counter: passkey.signCount,
      },
    });

    if (verification.verified) {
      await this.passkeyService.updateSignCount(
        passkey.id,
        verification.authenticationInfo.newCounter
      );
    }

    return verification;
  }
}
```

## Phase 3: SMS/OTP Authentication

### Firebase Implementation

#### 1. Install Dependencies
```bash
pnpm install firebase
pnpm install expo-firebase-auth
```

#### 2. Configure Firebase
```typescript
// config/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
```

#### 3. Create SMS Service
```typescript
// services/smsService.ts
import { auth, RecaptchaVerifier } from 'firebase/auth';

class SMSService {
  private recaptchaVerifier: any = null;

  initRecaptchaVerifier(containerId: string) {
    this.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
    });
  }

  async sendVerificationCode(phone: string) {
    if (!this.recaptchaVerifier) {
      throw new Error('Recaptcha verifier not initialized');
    }

    try {
      const confirmationResult = await auth.signInWithPhoneNumber(
        phone,
        this.recaptchaVerifier
      );
      return confirmationResult;
    } catch (error) {
      throw new Error('Failed to send verification code');
    }
  }

  async verifyCode(confirmationResult: any, code: string) {
    try {
      const result = await confirmationResult.confirm(code);
      return result.user;
    } catch (error) {
      throw new Error('Invalid verification code');
    }
  }
}

export const smsService = new SMSService();
```

## Environment Variables

Add these to your `.env` files:

```bash
# JWT
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-here

# WebAuthn
WEBAUTHN_RP_ID=localhost
WEBAUTHN_ORIGIN=http://localhost:3000

# Firebase
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=

# API URLs
NEXT_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_API_URL=http://localhost:3000
```

## Testing Checklist

- [ ] Email/password registration works
- [ ] Email/password login works
- [ ] JWT tokens are generated and validated
- [ ] Token refresh works
- [ ] Logout clears tokens
- [ ] Passkey registration works
- [ ] Passkey authentication works
- [ ] Passkey list/delete works
- [ ] SMS OTP send works
- [ ] SMS OTP verification works
- [ ] Account lockout works after failed attempts
- [ ] Email verification flow works
- [ ] Password reset flow works
