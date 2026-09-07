import { IsOptional, IsString, IsIn, Length } from 'class-validator';

export class UpdateUserDto {
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
