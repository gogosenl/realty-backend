import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TransactionDocument = Transaction & Document;

export enum TransactionType {
  SALE = 'sale',
  RENT = 'rent',
}

export enum PropertyType {
  HOUSE = 'house',
  LAND = 'land',
  SHOP = 'shop',
  APARTMENT = 'apartment',
  OFFICE = 'office',
  OTHER = 'other',
}

export enum TransactionStage {
  AGREEMENT = 'agreement',
  EARNEST_MONEY = 'earnest_money',
  TITLE_DEED = 'title_deed',
  COMPLETED = 'completed',
}

export class CommissionBreakdown {
  agencyAmount!: number;
  listingAgentAmount!: number;
  sellingAgentAmount!: number;
  totalServiceFee!: number;
}

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ required: true })
  propertyAddress!: string;

  @Prop({ required: true })
  city!: string;

  @Prop({ required: false })
  district!: string;

  @Prop({ required: true })
  salePrice!: number;

  @Prop({ required: true })
  totalServiceFee!: number;

  @Prop({
    type: String,
    enum: TransactionStage,
    default: TransactionStage.AGREEMENT,
  })
  stage!: TransactionStage;

  @Prop({ type: Types.ObjectId, ref: 'Agent', required: true })
  listingAgent!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Agent', required: true })
  sellingAgent!: Types.ObjectId;

  @Prop({ type: Object })
  commissionBreakdown!: CommissionBreakdown;

  @Prop()
  notes!: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy!: Types.ObjectId;

 @Prop({
  type: String,
  enum: TransactionType,
  required: false,
  default: TransactionType.SALE,
})
transactionType: TransactionType;

  @Prop({
    type: String,
    enum: PropertyType,
    required: false,
  })
  propertyType?: PropertyType;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
