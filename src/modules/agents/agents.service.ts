import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Agent, AgentDocument } from './agent.schema';
import { CreateAgentDto } from './agent.dto';

@Injectable()
export class AgentsService {
  constructor(
    @InjectModel(Agent.name) private agentModel: Model<AgentDocument>,
  ) {}

  async create(dto: CreateAgentDto): Promise<AgentDocument> {
    const agent = new this.agentModel(dto);
    return agent.save();
  }

  async findAll(): Promise<AgentDocument[]> {
    return this.agentModel.find().exec();
  }

  async findOne(id: string): Promise<AgentDocument> {
    const agent = await this.agentModel.findById(id).exec();
    if (!agent) throw new NotFoundException(`Agent ${id} not found`);
    return agent;
  }
}