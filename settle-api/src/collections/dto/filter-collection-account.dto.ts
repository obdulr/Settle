import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { CollectionAccountStatus } from '../../entities/collection-account.entity';

export class FilterCollectionAccountDto {
  @IsEnum(CollectionAccountStatus)
  @IsOptional()
  status?: CollectionAccountStatus;

  @IsString()
  @IsOptional()
  assignedTo?: string;

  @IsUUID()
  @IsOptional()
  creditorId?: string;

  @IsUUID()
  @IsOptional()
  crmClientId?: string;

  @IsString()
  @IsOptional()
  search?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
