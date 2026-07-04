import { IsString, IsNumber, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateDebtDto } from './create-debt.dto';

export class UpdateDebtDto extends PartialType(CreateDebtDto) {
  @IsOptional()
  @IsEnum(['active', 'settled', 'in_progress', 'default'])
  status?: string;
}