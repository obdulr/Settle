import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ required: false })
  user?: {
    id: string;
    email: string;
    role?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    createdAt?: string;
  };

  @ApiProperty({ required: false })
  accessToken?: string;

  @ApiProperty({ required: false })
  refreshToken?: string;

  @ApiProperty({ required: false })
  expiresIn?: number;

  @ApiProperty({ required: false })
  error?: string;
}