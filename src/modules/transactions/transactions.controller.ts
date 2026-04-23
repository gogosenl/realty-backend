import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TransactionsService } from './transactions.service';
import {
  CreateTransactionDto,
  UpdateStageDto,
  UpdateTransactionDto,
} from './transaction.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get('summary/financial')
  getFinancialSummary() {
    return this.transactionsService.getFinancialSummary();
  }

  @Get('summary/agent-earnings')
  getAgentEarnings() {
    return this.transactionsService.getAgentEarnings();
  }

  @Post()
create(@Body() dto: CreateTransactionDto, @Request() req: any) {
  return this.transactionsService.create(dto, req.user.id);
}

  @Get()
  findAll(@Request() req: any) {
    return this.transactionsService.findAll(req.user.email, req.user.role);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(id);
  }

  @Patch(':id/stage')
  updateStage(@Param('id') id: string, @Body() dto: UpdateStageDto) {
    return this.transactionsService.updateStage(id, dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTransactionDto) {
    return this.transactionsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.transactionsService.remove(id);
  }
}
