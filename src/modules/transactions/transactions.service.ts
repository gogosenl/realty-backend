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
  async getAgentEarnings(): Promise<any[]> {
  const completed = await this.transactionModel
    .find({ stage: TransactionStage.COMPLETED })
    .populate('listingAgent', 'name email')
    .populate('sellingAgent', 'name email')
    .exec();

  const earningsMap = new Map<string, { agent: any; total: number }>();

  for (const txn of completed) {
    const breakdown = txn.commissionBreakdown;
    if (!breakdown) continue;

    const listingId = (txn.listingAgent as any)._id.toString();
    const sellingId = (txn.sellingAgent as any)._id.toString();

    if (!earningsMap.has(listingId)) {
      earningsMap.set(listingId, { agent: txn.listingAgent, total: 0 });
    }
    earningsMap.get(listingId)!.total += breakdown.listingAgentAmount;

    if (listingId !== sellingId) {
      if (!earningsMap.has(sellingId)) {
        earningsMap.set(sellingId, { agent: txn.sellingAgent, total: 0 });
      }
      earningsMap.get(sellingId)!.total += breakdown.sellingAgentAmount;
    }
  }

  return Array.from(earningsMap.values());
}

async getFinancialSummary(): Promise<any> {
  const completed = await this.transactionModel
    .find({ stage: TransactionStage.COMPLETED })
    .exec();

  const totalRevenue = completed.reduce(
    (sum, txn) => sum + (txn.commissionBreakdown?.totalServiceFee ?? 0), 0
  );
  const agencyRevenue = completed.reduce(
    (sum, txn) => sum + (txn.commissionBreakdown?.agencyAmount ?? 0), 0
  );
  const agentRevenue = completed.reduce(
    (sum, txn) =>
      sum +
      (txn.commissionBreakdown?.listingAgentAmount ?? 0) +
      (txn.commissionBreakdown?.sellingAgentAmount ?? 0),
    0,
  );

  return {
    completedCount: completed.length,
    totalRevenue,
    agencyRevenue,
    agentRevenue,
  };
}
}