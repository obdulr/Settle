import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './entities/user.entity';
import { Activity } from './entities/activity.entity';
import { Debt } from './entities/debt.entity';
import { AuthModule } from './auth/auth.module';
import { ActivitiesModule } from './activities/activities.module';
import { DebtsModule } from './debts/debts.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes('railway') 
        ? { rejectUnauthorized: false }
        : false,
      entities: [User, Activity, Debt],
      synchronize: false,
      logging: process.env.NODE_ENV === 'development',
      autoLoadEntities: true,
      migrations: ['src/migrations/*.ts'],
      migrationsTableName: 'migrations',
    }),
    TypeOrmModule.forFeature([User, Activity, Debt]),
    AuthModule,
    ActivitiesModule,
    DebtsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}