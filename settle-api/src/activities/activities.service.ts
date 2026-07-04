import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity } from '../entities/activity.entity';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity)
    private activitiesRepository: Repository<Activity>,
  ) {}

  async createActivity(userId: string, type: string, description?: string, metadata?: Record<string, any>) {
    const activity = this.activitiesRepository.create({
      userId,
      type,
      description,
      metadata,
    });
    return this.activitiesRepository.save(activity);
  }

  async getUserActivities(userId: string, limit: number = 10) {
    return this.activitiesRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}