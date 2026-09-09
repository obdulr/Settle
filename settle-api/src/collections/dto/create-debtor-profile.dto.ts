import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';
import { BankruptcyStatus } from '../../entities/debtor-profile.entity';

export class CreateDebtorProfileDto {
  @IsUUID()
  crmClientId!: string;

  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @IsString()
  @Length(4, 4)
  @IsOptional()
  ssnLast4?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  aliases?: string[];

  @IsString()
  @Length(0, 255)
  @IsOptional()
  employerName?: string;

  @IsString()
  @Length(0, 30)
  @IsOptional()
  employerPhone?: string;

  @IsString()
  @Length(0, 255)
  @IsOptional()
  occupation?: string;

  @IsString()
  @Length(0, 255)
  @IsOptional()
  spouseName?: string;

  @IsArray()
  @IsObject({ each: true })
  @IsOptional()
  addressHistory?: {
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    from?: string;
    to?: string;
  }[];

  @IsEnum(BankruptcyStatus)
  @IsOptional()
  bankruptcyStatus?: BankruptcyStatus;

  @IsDateString()
  @IsOptional()
  deceasedDate?: string;

  @IsBoolean()
  @IsOptional()
  doNotCall?: boolean;

  @IsBoolean()
  @IsOptional()
  litigiousFlag?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsObject()
  @IsOptional()
  customFields?: Record<string, any>;
}
