import { IsNumber, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class BudgetItemDto {
  @IsOptional()
  id?: string;

  name!: string;

  @IsNumber()
  amount!: number;

  category!: string;

  recurring?: boolean;
}

export class CreateBudgetDto {
  @IsNumber()
  monthlyIncome!: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BudgetItemDto)
  expenses?: BudgetItemDto[];
}
