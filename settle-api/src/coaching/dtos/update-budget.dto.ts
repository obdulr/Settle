import { IsNumber, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { BudgetItemDto } from './create-budget.dto';

export class UpdateBudgetDto {
  @IsOptional()
  @IsNumber()
  monthlyIncome?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BudgetItemDto)
  expenses?: BudgetItemDto[];
}
