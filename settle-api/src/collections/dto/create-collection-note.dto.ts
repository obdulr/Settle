import { IsEnum, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';
import { CollectionNoteType } from '../../entities/collection-note.entity';

export class CreateCollectionNoteDto {
  @IsEnum(CollectionNoteType)
  @IsOptional()
  noteType?: CollectionNoteType;

  @IsString()
  content!: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @IsUUID()
  @IsOptional()
  authorId?: string;
}
