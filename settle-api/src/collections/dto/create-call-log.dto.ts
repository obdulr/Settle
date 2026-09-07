import { IsEnum, IsInt, IsOptional, IsString, IsUUID, IsDateString } from 'class-validator';
import { CallDirection, CallStatus } from '../../entities/call-log.entity';

export class CreateCallLogDto {
  @IsUUID()
  @IsOptional()
  collectionAccountId?: string;

  @IsString()
  phoneNumber!: string;

  @IsEnum(CallDirection)
  @IsOptional()
  direction?: CallDirection;

  @IsEnum(CallStatus)
  @IsOptional()
  status?: CallStatus;

  @IsDateString()
  @IsOptional()
  startedAt?: string;

  @IsDateString()
  @IsOptional()
  endedAt?: string;

  @IsInt()
  @IsOptional()
  duration?: number;

  @IsString()
  @IsOptional()
  recordingUrl?: string;

  @IsString()
  @IsOptional()
  transcript?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  provider?: string;

  @IsString()
  @IsOptional()
  providerCallId?: string;

  @IsString()
  @IsOptional()
  rawResponse?: string;
}
