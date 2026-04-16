import { IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { TransactionStage } from './transaction.schema';

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
  notes?: string;
}

export class UpdateStageDto {
  @IsNotEmpty()
    @IsEnum(TransactionStage)
    stage!: TransactionStage;
}