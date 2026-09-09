import {
  IsUUID,
  IsOptional,
  IsString,
  IsNumber,
  IsInt,
  IsDateString,
  IsEnum,
  Length,
  IsObject,
  Min,
} from 'class-validator';
import { CollectionAccountStatus } from '../../entities/collection-account.entity';

export class CreateCollectionAccountDto {
  @IsUUID()
  crmClientId!: string;

  @IsUUID()
  @IsOptional()
  creditorId?: string;

  @IsUUID()
  @IsOptional()
  debtBuyerId?: string;

  @IsString()
  @Length(0, 255)
  @IsOptional()
  accountNumber?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  originalBalance?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  currentBalance?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  interestRate?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  monthlyPayment?: number;

  @IsEnum(CollectionAccountStatus)
  @IsOptional()
  status?: CollectionAccountStatus;

  @IsInt()
  @IsOptional()
  priority?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  delinquencyDays?: number;

  @IsDateString()
  @IsOptional()
  lastPaymentDate?: string;

  @IsDateString()
  @IsOptional()
  statuteOfLimitationsDate?: string;

  @IsDateString()
  @IsOptional()
  chargedOffDate?: string;

  @IsUUID()
  @IsOptional()
  assignedTo?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsObject()
  @IsOptional()
  customFields?: Record<string, any>;
}
