import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type InviteDocument = Invite & Document;

@Schema({ timestamps: true })
export class Invite {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ default: false })
  used: boolean;
}

export const InviteSchema = SchemaFactory.createForClass(Invite);