import { IsDateString, IsEnum, IsInt, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';
import { CreditReportProvider, CreditReportStatus } from '../../entities/credit-report.entity';

export class CreateCreditReportDto {
  @IsUUID()
  @IsOptional()
  collectionAccountId?: string;

  @IsEnum(CreditReportProvider)
  @IsOptional()
  provider?: CreditReportProvider;

  @IsEnum(CreditReportStatus)
  @IsOptional()
  status?: CreditReportStatus;

  @IsObject()
  @IsOptional()
  requestPayload?: Record<string, any>;

  @IsInt()
  @IsOptional()
  creditScore?: number;

  @IsDateString()
  @IsOptional()
  reportDate?: string;

  @IsObject({ each: true })
  @IsOptional()
  accounts?: {
    creditorName?: string;
    accountNumber?: string;
    balance?: number;
    status?: string;
    openedDate?: string;
    lastReported?: string;
  }[];

  @IsObject({ each: true })
  @IsOptional()
  inquiries?: {
    inquiryDate?: string;
    creditorName?: string;
    type?: string;
  }[];

  @IsObject({ each: true })
  @IsOptional()
  publicRecords?: {
    type?: string;
    amount?: number;
    dateFiled?: string;
    dateResolved?: string;
  }[];

  @IsString({ each: true })
  @IsOptional()
  warnings?: string[];

  @IsObject()
  @IsOptional()
  rawResponse?: Record<string, any>;

  @IsString()
  @IsOptional()
  notes?: string;
}
