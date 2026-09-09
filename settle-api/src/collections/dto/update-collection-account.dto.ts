import { PartialType } from '@nestjs/mapped-types';
import { CreateCollectionAccountDto } from './create-collection-account.dto';

export class UpdateCollectionAccountDto extends PartialType(CreateCollectionAccountDto) {}
