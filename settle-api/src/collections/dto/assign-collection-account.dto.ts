import { IsNotEmpty, IsString } from 'class-validator';

export class AssignCollectionAccountDto {
  @IsString()
  @IsNotEmpty()
  assignedTo: string;
}
