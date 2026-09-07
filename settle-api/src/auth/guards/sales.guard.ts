import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class SalesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || (user.role !== 'sales' && user.role !== 'admin')) {
      throw new ForbiddenException('Sales or admin access required');
    }
    return true;
  }
}
