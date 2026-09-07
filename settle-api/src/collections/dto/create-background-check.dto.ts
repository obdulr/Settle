import { IsBoolean, IsEnum, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';
import { BackgroundCheckProvider, BackgroundCheckStatus } from '../../entities/background-check.entity';

export class CreateBackgroundCheckDto {
  @IsUUID()
  @IsOptional()
  collectionAccountId?: string;

  @IsEnum(BackgroundCheckProvider)
  @IsOptional()
  provider?: BackgroundCheckProvider;

  @IsEnum(BackgroundCheckStatus)
  @IsOptional()
  status?: BackgroundCheckStatus;

  @IsObject()
  @IsOptional()
  requestPayload?: Record<string, any>;

  @IsObject({ each: true })
  @IsOptional()
  criminalRecords?: {
    source?: string;
    offense?: string;
    disposition?: string;
    sentencingDate?: string;
    jurisdiction?: string;
  }[];

  @IsObject({ each: true })
  @IsOptional()
  civilRecords?: {
    type?: string;
    court?: string;
    filingDate?: string;
    disposition?: string;
    amount?: number;
  }[];

  @IsObject({ each: true })
  @IsOptional()
  employmentVerification?: {
    employerName?: string;
    verified?: boolean;
    position?: string;
    startDate?: string;
    endDate?: string;
  }[];

  @IsObject({ each: true })
  @IsOptional()
  educationVerification?: {
    institution?: string;
    degree?: string;
    verified?: boolean;
    completionDate?: string;
  }[];

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

  @IsString()
  @IsOptional()
  sexOffenderStatus?: string;

  @IsObject({ each: true })
  @IsOptional()
  globalWatchlist?: {
    source?: string;
    matchType?: string;
    name?: string;
    details?: string;
  }[];

  @IsBoolean()
  @IsOptional()
  adverseActionRequired?: boolean;

  @IsObject()
  @IsOptional()
  rawResponse?: Record<string, any>;

  @IsString()
  @IsOptional()
  notes?: string;
}
