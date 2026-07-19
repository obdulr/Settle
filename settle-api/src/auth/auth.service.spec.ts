import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from '../entities/user.entity';
import { Provider } from '../entities/provider.entity';
import { ActivitiesService } from '../activities/activities.service';
import { EmailService } from '../email/email.service';
import { RegisterDto } from './dtos/register.dto';

// Mock the email service module — the repo has an extensionless
// ``email.service`` file that Jest would pick up before ``email.service.ts``,
// causing a parse error.  An explicit factory avoids loading the real file.
jest.mock('../email/email.service', () => ({
  EmailService: jest.fn().mockImplementation(() => ({
    sendVerificationEmail: jest.fn().mockResolvedValue(true),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
    sendPasswordResetConfirmation: jest.fn().mockResolvedValue(true),
    sendOtpEmail: jest.fn().mockResolvedValue(true),
  })),
}));

describe('AuthService', () => {
  let service: AuthService;
  let usersRepository: any;
  let providersRepository: any;
  let jwtService: any;
  let activitiesService: any;
  let emailService: any;

  beforeEach(async () => {
    usersRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    providersRepository = {
      findOne: jest.fn(),
    };
    jwtService = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
      verify: jest.fn(),
    };
    activitiesService = {
      createActivity: jest.fn().mockResolvedValue(undefined),
    };
    emailService = {
      sendVerificationEmail: jest.fn().mockResolvedValue(true),
      sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
      sendPasswordResetConfirmation: jest.fn().mockResolvedValue(true),
      sendOtpEmail: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: usersRepository },
        { provide: getRepositoryToken(Provider), useValue: providersRepository },
        { provide: JwtService, useValue: jwtService },
        { provide: ActivitiesService, useValue: activitiesService },
        { provide: EmailService, useValue: emailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  // ── Helper: create a mock user with a real bcrypt hash ────────────────
  const createMockUser = async (overrides: Partial<User> = {}): Promise<User> => {
    const hashedPassword = await bcrypt.hash('StrongP@ss1', 10);
    return {
      id: 'user-uuid-1',
      email: 'test@example.com',
      password: hashedPassword,
      role: 'customer',
      firstName: 'Test',
      lastName: 'User',
      phone: '5551234567',
      emailVerified: false,
      accountLocked: false,
      failedLoginAttempts: 0,
      lockoutExpiresAt: null,
      createdAt: new Date(),
      ...overrides,
    } as User;
  };

  // ═════════════════════════════════════════════════════════════════════
  // 1. AUTH FLOW
  // ═════════════════════════════════════════════════════════════════════
  describe('Auth flow', () => {
    describe('register', () => {
      it('registers a new user and returns JWT tokens', async () => {
        usersRepository.findOne.mockResolvedValue(null);
        const createdUser = { id: 'new-user-id', email: 'new@test.com', role: 'customer', firstName: 'New', lastName: 'User' };
        usersRepository.create.mockReturnValue(createdUser);
        usersRepository.save.mockResolvedValue(createdUser);

        const dto: RegisterDto = {
          email: 'new@test.com',
          password: 'StrongP@ss1',
          firstName: 'New',
          lastName: 'User',
        };

        const result = await service.register(dto);

        expect(result.success).toBe(true);
        expect(result.accessToken).toBeDefined();
        expect(result.refreshToken).toBeDefined();
        expect(result.expiresIn).toBe(3600);
        expect(result.user.email).toBe('new@test.com');
        expect(jwtService.sign).toHaveBeenCalledTimes(2); // access + refresh
      });

      it('rejects duplicate email registration', async () => {
        usersRepository.findOne.mockResolvedValue({ id: 'existing', email: 'dup@test.com' });

        const dto: RegisterDto = {
          email: 'dup@test.com',
          password: 'StrongP@ss1',
        };

        await expect(service.register(dto)).rejects.toThrow(UnauthorizedException);
      });
    });

    describe('login', () => {
      it('logs in a valid user and returns tokens', async () => {
        const mockUser = await createMockUser();
        // login() receives the user object from validateUser (password stripped)
        const { password: _, ...userWithoutPassword } = mockUser;

        const result = await service.login(userWithoutPassword);

        expect(result.success).toBe(true);
        expect(result.accessToken).toBeDefined();
        expect(result.refreshToken).toBeDefined();
        expect(result.user.email).toBe('test@example.com');
        expect(activitiesService.createActivity).toHaveBeenCalledWith(
          mockUser.id,
          'login',
          'User logged in',
          { email: mockUser.email },
        );
      });

      it('does not log activity for provider role', async () => {
        const providerUser = { id: 'p1', email: 'p@test.com', role: 'provider', firstName: 'Corp', lastName: '' };

        const result = await service.login(providerUser);

        expect(result.success).toBe(true);
        expect(activitiesService.createActivity).not.toHaveBeenCalled();
      });
    });

    describe('getProfile', () => {
      it('returns the user profile without password', async () => {
        const mockUser = await createMockUser();
        usersRepository.findOne.mockResolvedValue(mockUser);

        const result = await service.getProfile('user-uuid-1');

        expect(result.email).toBe('test@example.com');
        expect(result.id).toBe('user-uuid-1');
        expect((result as any).password).toBeUndefined();
      });

      it('throws UnauthorizedException when user not found', async () => {
        usersRepository.findOne.mockResolvedValue(null);

        await expect(service.getProfile('nonexistent')).rejects.toThrow(UnauthorizedException);
      });
    });

    describe('refreshToken', () => {
      it('exchanges a valid refresh token for a new access token', async () => {
        const mockUser = await createMockUser();
        jwtService.verify.mockReturnValue({ sub: mockUser.id, email: mockUser.email });
        usersRepository.findOne.mockResolvedValue(mockUser);

        const result = await service.refreshToken('valid-refresh-token');

        expect(result.success).toBe(true);
        expect(result.accessToken).toBeDefined();
        expect(result.expiresIn).toBe(3600);
        expect(jwtService.sign).toHaveBeenCalledWith(
          expect.objectContaining({ sub: mockUser.id }),
          expect.objectContaining({ expiresIn: '1h' }),
        );
      });

      it('rejects an invalid refresh token', async () => {
        jwtService.verify.mockImplementation(() => {
          throw new Error('invalid token');
        });

        await expect(service.refreshToken('bad-token')).rejects.toThrow(UnauthorizedException);
      });

      it('rejects a refresh token for a deleted user', async () => {
        jwtService.verify.mockReturnValue({ sub: 'deleted-user' });
        usersRepository.findOne.mockResolvedValue(null);

        await expect(service.refreshToken('token')).rejects.toThrow(UnauthorizedException);
      });
    });

    describe('logout', () => {
      it('returns success', async () => {
        const result = await service.logout();

        expect(result.success).toBe(true);
        expect(result.message).toContain('Logged out');
      });
    });
  });

  // ═════════════════════════════════════════════════════════════════════
  // 2. PASSWORD VALIDATION
  // ═════════════════════════════════════════════════════════════════════
  describe('Password validation', () => {
    it('rejects a password with no uppercase letter', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      const dto: RegisterDto = {
        email: 'pw1@test.com',
        password: 'alllowercase1!',
      };

      await expect(service.register(dto)).rejects.toThrow(BadRequestException);
    });

    it('rejects a password with no lowercase letter', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      const dto: RegisterDto = {
        email: 'pw2@test.com',
        password: 'ALLUPPERCASE1!',
      };

      await expect(service.register(dto)).rejects.toThrow(BadRequestException);
    });

    it('rejects a password with no number', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      const dto: RegisterDto = {
        email: 'pw3@test.com',
        password: 'NoNumbersHere!',
      };

      await expect(service.register(dto)).rejects.toThrow(BadRequestException);
    });

    it('rejects a password with no special character', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      const dto: RegisterDto = {
        email: 'pw4@test.com',
        password: 'NoSpecialChar1',
      };

      await expect(service.register(dto)).rejects.toThrow(BadRequestException);
    });

    it('rejects a password shorter than 8 characters', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      const dto: RegisterDto = {
        email: 'pw5@test.com',
        password: 'Sh0rt!',
      };

      await expect(service.register(dto)).rejects.toThrow(BadRequestException);
    });

    it('accepts a strong password', async () => {
      usersRepository.findOne.mockResolvedValue(null);
      const createdUser = { id: 'u1', email: 'pw6@test.com', role: 'customer' };
      usersRepository.create.mockReturnValue(createdUser);
      usersRepository.save.mockResolvedValue(createdUser);

      const dto: RegisterDto = {
        email: 'pw6@test.com',
        password: 'Str0ngP@ss!',
      };

      const result = await service.register(dto);
      expect(result.success).toBe(true);
    });
  });

  // ═════════════════════════════════════════════════════════════════════
  // 3. ACCOUNT LOCKOUT
  // ═════════════════════════════════════════════════════════════════════
  describe('Account lockout', () => {
    it('locks the account after 5 failed login attempts', async () => {
      const user = await createMockUser({ failedLoginAttempts: 4 });

      // recordFailedLogin is private — access via bracket notation
      await (service as any).recordFailedLogin(user);

      expect(usersRepository.update).toHaveBeenCalledWith(
        user.id,
        expect.objectContaining({
          failedLoginAttempts: 5,
          accountLocked: true,
          lockoutExpiresAt: expect.any(Date),
        }),
      );
    });

    it('does not lock the account before 5 failed attempts', async () => {
      const user = await createMockUser({ failedLoginAttempts: 2 });

      await (service as any).recordFailedLogin(user);

      expect(usersRepository.update).toHaveBeenCalledWith(
        user.id,
        expect.objectContaining({
          failedLoginAttempts: 3,
          accountLocked: false,
          lockoutExpiresAt: null,
        }),
      );
    });

    it('prevents login for a locked account even with correct password', async () => {
      const futureDate = new Date(Date.now() + 15 * 60 * 1000); // 15 min in future
      const lockedUser = await createMockUser({
        accountLocked: true,
        lockoutExpiresAt: futureDate,
      });
      usersRepository.findOne.mockResolvedValue(lockedUser);

      await expect(
        service.validateUser('test@example.com', 'StrongP@ss1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('returns null when user does not exist', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      const result = await service.validateUser('nobody@test.com', 'anypassword');
      expect(result).toBeNull();
    });
  });
});
