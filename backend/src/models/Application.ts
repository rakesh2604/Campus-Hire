import mongoose, { Schema, Document } from 'mongoose'

export interface IApplication extends Document {
  jobId: mongoose.Types.ObjectId
  candidateId: mongoose.Types.ObjectId
  status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'accepted'
  resume?: string
  coverLetter?: string
  rounds?: Array<{
    roundNumber: number
    roundName: string
    status: 'pending' | 'scheduled' | 'completed' | 'passed' | 'failed'
    scheduledDate?: Date
    completedDate?: Date
    feedback?: string
    score?: number
  }>
  currentRound?: number
  totalRounds?: number
  createdAt: Date
  updatedAt: Date
}

const ApplicationSchema = new Schema<IApplication>(
  {
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    candidateId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'shortlisted', 'rejected', 'accepted'],
      default: 'pending',
    },
    resume: {
      type: String,
    },
    coverLetter: {
      type: String,
    },
    rounds: [{
      roundNumber: {
        type: Number,
        required: true,
      },
      roundName: {
        type: String,
        required: true,
      },
      status: {
        type: String,
        enum: ['pending', 'scheduled', 'completed', 'passed', 'failed'],
        default: 'pending',
      },
      scheduledDate: {
        type: Date,
      },
      completedDate: {
        type: Date,
      },
      feedback: {
        type: String,
      },
      score: {
        type: Number,
        min: 0,
        max: 100,
      },
    }],
    currentRound: {
      type: Number,
      default: 1,
      min: 1,
    },
    totalRounds: {
      type: Number,
      default: 3,
      min: 1,
    },
  },
  {
    timestamps: true,
  }
)

// Index to prevent duplicate applications
ApplicationSchema.index({ jobId: 1, candidateId: 1 }, { unique: true })

export const Application = mongoose.model<IApplication>('Application', ApplicationSchema)

