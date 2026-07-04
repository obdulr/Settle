import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class ThrottlerGuard extends ThrottlerGuard {
  protected errorMessage = 'Too many requests, please try again later';
}