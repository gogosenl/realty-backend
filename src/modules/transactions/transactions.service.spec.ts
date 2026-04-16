import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { Transaction, TransactionStage } from './transaction.schema';
import { describe, beforeEach, it } from 'node:test';

const mockTransaction = (overrides = {}) => ({
  _id: 'txn123',
  propertyAddress: 'Test Cad. No:1',
  salePrice: 1000000,
  totalServiceFee: 30000,
  stage: TransactionStage.AGREEMENT,
  listingAgent: { _id: 'agent1', toString: () => 'agent1' },
  sellingAgent: { _id: 'agent2', toString: () => 'agent2' },
  commissionBreakdown: null,
  save: jest.fn().mockResolvedValue(true),
  ...overrides,
});

const mockTransactionModel = {
  create: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  save: jest.fn(),
};

describe('TransactionsService', () => {
  let service: TransactionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: getModelToken(Transaction.name),
          useValue: function () {
            return mockTransaction();
          },
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
  });

  describe('komisyon hesaplama', () => {
    it('farklı ajanlar: her biri %25 almalı', async () => {
      const txn = mockTransaction({
        stage: TransactionStage.TITLE_DEED,
        listingAgent: { _id: 'agent1', toString: () => 'agent1' },
        sellingAgent: { _id: 'agent2', toString: () => 'agent2' },
      });

      jest.spyOn(service, 'findOne').mockResolvedValue(txn as any);
      txn.save.mockResolvedValue({ ...txn, stage: TransactionStage.COMPLETED, commissionBreakdown: {
        totalServiceFee: 30000,
        agencyAmount: 15000,
        listingAgentAmount: 7500,
        sellingAgentAmount: 7500,
      }});

      const result = await service.updateStage('txn123', {
        stage: TransactionStage.COMPLETED,
      });

      expect(txn.save);
    });

    it('aynı ajan: %50 agent payının tamamını almalı', async () => {
      const txn = mockTransaction({
        stage: TransactionStage.TITLE_DEED,
        listingAgent: { _id: 'agent1', toString: () => 'agent1' },
        sellingAgent: { _id: 'agent1', toString: () => 'agent1' },
      });

      jest.spyOn(service, 'findOne').mockResolvedValue(txn as any);

      await service.updateStage('txn123', {
        stage: TransactionStage.COMPLETED,
      });

      const breakdown = txn.commissionBreakdown;
      expect(breakdown.agencyAmount).toBe(15000);
      expect(breakdown.listingAgentAmount).toBe(15000);
      expect(breakdown.sellingAgentAmount).toBe(0);
    });

    it('acente her zaman %50 almalı', async () => {
      const txn = mockTransaction({
        stage: TransactionStage.TITLE_DEED,
        totalServiceFee: 100000,
      });

      jest.spyOn(service, 'findOne').mockResolvedValue(txn as any);

      await service.updateStage('txn123', {
        stage: TransactionStage.COMPLETED,
      });

      expect(txn.commissionBreakdown.agencyAmount).toBe(50000);
    });
  });

  describe('stage geçişleri', () => {
    it('geçerli sıradaki stage geçişine izin vermeli', async () => {
      const txn = mockTransaction({ stage: TransactionStage.AGREEMENT });
      jest.spyOn(service, 'findOne').mockResolvedValue(txn as any);

      await expect(
        service.updateStage('txn123', { stage: TransactionStage.EARNEST_MONEY }),
      ).resolves.not.toThrow();
    });

    it('geçersiz stage geçişinde hata fırlatmalı', async () => {
      const txn = mockTransaction({ stage: TransactionStage.AGREEMENT });
      jest.spyOn(service, 'findOne').mockResolvedValue(txn as any);

      await expect(
        service.updateStage('txn123', { stage: TransactionStage.COMPLETED }),
      ).rejects.toThrow(BadRequestException);
    });

    it('aynı stage geçişinde hata fırlatmalı', async () => {
      const txn = mockTransaction({ stage: TransactionStage.AGREEMENT });
      jest.spyOn(service, 'findOne').mockResolvedValue(txn as any);

      await expect(
        service.updateStage('txn123', { stage: TransactionStage.AGREEMENT }),
      ).rejects.toThrow(BadRequestException);
    });

    it('geri stage geçişinde hata fırlatmalı', async () => {
      const txn = mockTransaction({ stage: TransactionStage.EARNEST_MONEY });
      jest.spyOn(service, 'findOne').mockResolvedValue(txn as any);

      await expect(
        service.updateStage('txn123', { stage: TransactionStage.AGREEMENT }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});

function expect(save: any) {
    throw new Error('Function not implemented.');
}
