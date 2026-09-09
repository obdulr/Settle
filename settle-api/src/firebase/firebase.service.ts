import { Injectable, Logger } from '@nestjs/common';
import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

@Injectable()
export class FirebaseService {
  private readonly logger = new Logger(FirebaseService.name);
  private app: App | undefined;

  constructor() {
    const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccountRaw) {
      this.logger.warn('FIREBASE_SERVICE_ACCOUNT not set; Firebase Admin will not be initialized.');
      return;
    }

    try {
      const serviceAccount = JSON.parse(serviceAccountRaw);
      if (getApps().length === 0) {
        this.app = initializeApp({
          credential: cert(serviceAccount),
        });
      } else {
        this.app = getApps()[0];
      }
      this.logger.log('Firebase Admin initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin:', error);
    }
  }

  async verifyPhoneToken(
    idToken: string,
    expectedPhone?: string,
  ): Promise<{ success: boolean; phone?: string; error?: string; uid?: string }> {
    if (!this.app) {
      return { success: false, error: 'Firebase Admin is not initialized' };
    }

    try {
      const decoded = await getAuth(this.app).verifyIdToken(idToken);
      const phone = decoded.phone_number;
      if (!phone) {
        return { success: false, error: 'Token does not contain a phone number' };
      }
      if (expectedPhone && phone !== expectedPhone) {
        return { success: false, error: 'Phone number in token does not match expected phone' };
      }
      return { success: true, phone, uid: decoded.uid };
    } catch (error: any) {
      this.logger.error('Failed to verify Firebase ID token:', error.message);
      return { success: false, error: error.message || 'Invalid token' };
    }
  }
}
