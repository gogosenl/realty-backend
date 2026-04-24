import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import {
  TransactionStage,
  TransactionType,
  PropertyType,
} from './transaction.schema';

export class CreateTransactionDto {
  @IsNotEmpty()
  @IsString()
  propertyAddress!: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  salePrice!: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  totalServiceFee!: number;

  @IsNotEmpty()
  @IsMongoId()
  listingAgent!: string;

  @IsNotEmpty()
  @IsMongoId()
  sellingAgent!: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsMongoId()
  createdBy?: string;

  @IsOptional()
  @IsEnum(TransactionType)
  transactionType?: TransactionType;

  @IsOptional()
  @IsEnum(PropertyType)
  propertyType?: PropertyType;
}

export class UpdateStageDto {
  @IsNotEmpty()
  @IsEnum(TransactionStage)
  stage!: TransactionStage;
}

export class UpdateTransactionDto {
  @IsOptional()
  @IsString()
  propertyAddress?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  salePrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalServiceFee?: number;

  @IsOptional()
  @IsMongoId()
  listingAgent?: string;

  @IsOptional()
  @IsMongoId()
  sellingAgent?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(TransactionType)
  transactionType?: TransactionType;

  @IsOptional()
  @IsEnum(PropertyType)
  propertyType?: PropertyType;
}
