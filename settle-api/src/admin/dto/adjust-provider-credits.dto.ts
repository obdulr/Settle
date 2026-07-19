import { IsNumber, IsOptional, IsString } from 'class-validator';

export class AdjustProviderCreditsDto {
  @IsNumber()
  amount!: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
