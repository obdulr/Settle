import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsDateString,
} from 'class-validator';

export class CreateGoalDto {
  @IsString()
  title!: string;

  @IsNumber()
  targetAmount!: number;

  @IsOptional()
  @IsNumber()
  currentAmount?: number;

  @IsEnum(['debt_payoff', 'savings', 'emergency_fund'])
  @IsOptional()
  type?: string;

  @IsOptional()
  @IsDateString()
  deadline?: string;
}
