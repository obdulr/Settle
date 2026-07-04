import { IsString, IsNumber, IsOptional, IsEnum, IsDateString } from 'class-validator';

export class CreateDebtDto {
  @IsString()
  creditor!: string;

  @IsNumber()
  balance!: number;

  @IsOptional()
  @IsNumber()
  interestRate?: number;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsEnum(['credit_card', 'personal_loan', 'medical', 'student_loan', 'other'])
  @IsOptional()
  type?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}