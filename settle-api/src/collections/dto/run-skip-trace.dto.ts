import { IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

export class RunSkipTraceDto {
  @IsUUID()
  @IsOptional()
  collectionAccountId?: string;

  @IsString()
  @IsOptional()
  provider?: string;

  @IsObject()
  searchCriteria!: {
    firstName?: string;
    lastName?: string;
    ssnLast4?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    phone?: string;
  };

  @IsString()
  @IsOptional()
  notes?: string;
}
