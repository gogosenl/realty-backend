import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AgentDocument = Agent & Document;

@Schema({ timestamps: true })
export class Agent {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, unique: true })
  email!: string;

  @Prop({
    required: false,
    default: '',
    validate: {
      validator: (v: string) => !v || /^05\d{9}$/.test(v),
      message: 'Telefon numarası 05 ile başlamalı ve 11 haneli olmalıdır'
    }
  })
  phone!: string;
}

export const AgentSchema = SchemaFactory.createForClass(Agent);