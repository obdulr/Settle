import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class CreateLeadDto {
  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  phone!: string;

  @IsString()
  @Length(2, 2)
  state!: string;

  @IsNumber()
  @Min(0)
  totalDebt!: number;

  @IsOptional()
  @IsString()
  zipCode?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  debtTypes?: string[];

  @IsOptional()
  @IsString()
  employmentStatus?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyIncome?: number;

  @IsOptional()
  @IsString()
  creditScore?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  monthsBehind?: number;

  @IsOptional()
  @IsBoolean()
  hasFiledBankruptcy?: boolean;

  @IsBoolean()
  tcpaConsent!: boolean;
}
