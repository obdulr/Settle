import { IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class ManualAssignLeadDto {
  @IsUUID('4')
  providerId!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;
}
