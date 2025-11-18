import mongoose, { Schema, Document } from 'mongoose'

export type PlacedAIIntensity = 'light' | 'normal' | 'intense'

export interface IUserGoal extends Document {
  userId: mongoose.Types.ObjectId
  targetRole: string
  targetCompanies: string[]
  targetTimelineWeeks: number
  intensity: PlacedAIIntensity
  createdAt: Date
  updatedAt: Date
}

export interface IPlacedAIPlanItem {
  _id?: mongoose.Types.ObjectId
  type: 'challenge' | 'contest' | 'assessment'
  referenceId: string
  title: string
  targetCount: number
  completedCount: number
  status: 'pending' | 'in_progress' | 'done'
}

export interface IPlacedAIPlan extends Document {
  userId: mongoose.Types.ObjectId
  startDate: Date
  endDate: Date
  items: IPlacedAIPlanItem[]
  createdAt: Date
  updatedAt: Date
}

const UserGoalSchema = new Schema<IUserGoal>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetRole: { type: String, required: true },
    targetCompanies: { type: [String], default: [] },
    targetTimelineWeeks: { type: Number, default: 8 },
    intensity: { type: String, enum: ['light', 'normal', 'intense'], default: 'normal' },
  },
  { timestamps: true }
)

const PlacedAIPlanItemSchema = new Schema<IPlacedAIPlanItem>(
  {
    type: { type: String, enum: ['challenge', 'contest', 'assessment'], required: true },
    referenceId: { type: String, required: true },
    title: { type: String, required: true },
    targetCount: { type: Number, default: 1 },
    completedCount: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'in_progress', 'done'], default: 'pending' },
  },
  { _id: true }
)

const PlacedAIPlanSchema = new Schema<IPlacedAIPlan>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    items: { type: [PlacedAIPlanItemSchema], default: [] },
  },
  { timestamps: true }
)

export const UserGoal = mongoose.model<IUserGoal>('UserGoal', UserGoalSchema)
export const PlacedAIPlan = mongoose.model<IPlacedAIPlan>('PlacedAIPlan', PlacedAIPlanSchema)


