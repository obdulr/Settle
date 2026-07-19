import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateProviderDto {
  @IsString()
  @MinLength(2)
  companyName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  minDebtAmount?: number;

  @IsOptional()
  @IsNumber()
  feePercentage?: number;

  @IsOptional()
  @IsNumber()
  yearsInBusiness?: number;

  @IsOptional()
  @IsString()
  bbbRating?: string;

  @IsOptional()
  @IsBoolean()
  isAfccMember?: boolean;

  @IsOptional()
  @IsBoolean()
  isIapdaMember?: boolean;

  @IsOptional()
  @IsString()
  subscriptionType?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  serviceTypes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  debtTypes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  statesServed?: string[];
}
