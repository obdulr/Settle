import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { API_BASE_URL, formatDate } from '@settle/shared';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth(): object {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'settle-api'
    };
  }

  @Get('test-shared')
  testShared(): object {
    return {
      message: 'Shared package is working!',
      apiBaseUrl: API_BASE_URL,
      currentDate: formatDate(new Date())
    };
  }
}
