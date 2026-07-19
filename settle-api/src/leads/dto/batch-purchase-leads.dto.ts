import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class BatchPurchaseLeadsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  leadIds!: string[];
}
