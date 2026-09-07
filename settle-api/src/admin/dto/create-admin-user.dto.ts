import { IsEmail, IsIn, IsOptional, IsString, Length, MinLength } from 'class-validator';

export class CreateAdminUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @Length(1, 255)
  @IsOptional()
  firstName?: string;

  @IsString()
  @Length(1, 255)
  @IsOptional()
  lastName?: string;

  @IsString()
  @Length(1, 20)
  @IsOptional()
  phone?: string;

  @IsIn(['customer', 'provider', 'sales', 'admin'])
  @IsOptional()
  role?: string;
}
