import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActivitiesService } from './activities.service';

@Controller('activities')
@UseGuards(JwtAuthGuard)
export class ActivitiesController {
  constructor(private activitiesService: ActivitiesService) {}

  @Get()
  async getUserActivities(@Request() req) {
    return this.activitiesService.getUserActivities(req.user.sub);
  }
}