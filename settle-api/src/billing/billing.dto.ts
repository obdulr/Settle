import { IsString, IsNumber, IsOptional, IsIn, IsUUID, IsNotEmpty } from 'class-validator';

export class BankingWebhookDto {
  @IsString()
  @IsNotEmpty()
  reference!: string;

  @IsNumber()
  amount!: number;

  @IsString()
  @IsIn(['ach', 'wire', 'check', 'manual'])
  method!: string;

  @IsString()
  @IsOptional()
  externalTransactionId?: string;

  @IsString()
  @IsOptional()
  date?: string;
}

export class SubmitDepositDto {
  @IsNumber()
  amount!: number;

  @IsString()
  @IsIn(['ach', 'wire', 'check'])
  method!: string;

  @IsString()
  @IsOptional()
  reference?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class ManualDepositDto {
  @IsUUID()
  providerId!: string;

  @IsNumber()
  amount!: number;

  @IsString()
  @IsIn(['ach', 'wire', 'check', 'manual'])
  method!: string;

  @IsString()
  @IsOptional()
  reference?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class RejectDepositDto {
  @IsString()
  @IsOptional()
  reason?: string;
}
