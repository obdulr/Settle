import { IsOptional, IsString, IsUUID } from 'class-validator';

export class RunDialerCallDto {
  @IsString()
  to!: string;

  @IsString()
  @IsOptional()
  from?: string;

  @IsUUID()
  @IsOptional()
  collectionAccountId?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
