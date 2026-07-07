import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './entities/user.entity';
import { Activity } from './entities/activity.entity';
import { Debt } from './entities/debt.entity';
import { Provider } from './entities/provider.entity';
import { Lead } from './entities/lead.entity';
import { AuthModule } from './auth/auth.module';
import { ActivitiesModule } from './activities/activities.module';
import { DebtsModule } from './debts/debts.module';
import { ProvidersModule } from './providers/providers.module';
import { LeadsModule } from './leads/leads.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes('localhost')
        ? false
        : { rejectUnauthorized: false },
      entities: [User, Activity, Debt, Provider, Lead],
      synchronize: process.env.NODE_ENV !== 'production' || process.env.DB_SYNC === 'true',
      logging: process.env.NODE_ENV === 'development',
      autoLoadEntities: true,
    }),
    TypeOrmModule.forFeature([User, Activity, Debt, Provider, Lead]),
    AuthModule,
    ActivitiesModule,
    DebtsModule,
    ProvidersModule,
    LeadsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}