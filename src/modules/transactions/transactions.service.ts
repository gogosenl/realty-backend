import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transaction, TransactionDocument, TransactionStage } from './transaction.schema';
import { CreateTransactionDto, UpdateStageDto } from './transaction.dto';

const STAGE_ORDER = [
  TransactionStage.AGREEMENT,
  TransactionStage.EARNEST_MONEY,
  TransactionStage.TITLE_DEED,
  TransactionStage.COMPLETED,
];

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
  ) {}

  async create(dto: CreateTransactionDto): Promise<TransactionDocument> {
    const transaction = new this.transactionModel(dto);
    return transaction.save();
  }

  async findAll(): Promise<TransactionDocument[]> {
    return this.transactionModel
      .find()
      .populate('listingAgent', 'name email')
      .populate('sellingAgent', 'name email')
      .exec();
  }

  async findOne(id: string): Promise<TransactionDocument> {
    const transaction = await this.transactionModel
      .findById(id)
      .populate('listingAgent', 'name email')
      .populate('sellingAgent', 'name email')
      .exec();
    if (!transaction) throw new NotFoundException(`Transaction ${id} not found`);
    return transaction;
  }

  async updateStage(id: string, dto: UpdateStageDto): Promise<TransactionDocument> {
    const transaction = await this.findOne(id);

    const currentIndex = STAGE_ORDER.indexOf(transaction.stage);
    const nextIndex = STAGE_ORDER.indexOf(dto.stage);

    if (nextIndex !== currentIndex + 1) {
      throw new BadRequestException(
        `Invalid stage transition from ${transaction.stage} to ${dto.stage}`,
      );
    }

    transaction.stage = dto.stage;

    if (dto.stage === TransactionStage.COMPLETED) {
      transaction.commissionBreakdown = this.calculateCommission(transaction);
    }

    return transaction.save();
  }

  private calculateCommission(transaction: TransactionDocument) {
    const total = transaction.totalServiceFee;
    const agencyAmount = total * 0.5;
    const agentPool = total * 0.5;

    const listingAgentId = transaction.listingAgent.toString();
    const sellingAgentId = transaction.sellingAgent.toString();

    const isSameAgent = listingAgentId === sellingAgentId;

    return {
      totalServiceFee: total,
      agencyAmount,
      listingAgentAmount: isSameAgent ? agentPool : agentPool * 0.5,
      sellingAgentAmount: isSameAgent ? 0 : agentPool * 0.5,
    };
  }
}