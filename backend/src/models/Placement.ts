import mongoose, { Schema, Document } from 'mongoose'

export interface IPlacement extends Document {
  studentId: mongoose.Types.ObjectId
  jobId: mongoose.Types.ObjectId
  applicationId: mongoose.Types.ObjectId
  batch: string // e.g., "2024", "2025"
  rounds: Array<{
    roundNumber: number
    roundName: string // e.g., "Technical Round", "HR Round", "Final Round"
    status: 'pending' | 'scheduled' | 'completed' | 'passed' | 'failed'
    scheduledDate?: Date
    completedDate?: Date
    feedback?: string
    score?: number
    interviewer?: string
  }>
  currentRound: number
  totalRounds: number
  status: 'in-progress' | 'selected' | 'rejected' | 'on-hold'
  placementDate?: Date
  offerDetails?: {
    ctc?: number
    joiningDate?: Date
    location?: string
  }
  createdAt: Date
  updatedAt: Date
}

const PlacementSchema = new Schema<IPlacement>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
    },
    batch: {
      type: String,
      required: true,
      trim: true,
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
      interviewer: {
        type: String,
      },
    }],
    currentRound: {
      type: Number,
      default: 1,
      min: 1,
    },
    totalRounds: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ['in-progress', 'selected', 'rejected', 'on-hold'],
      default: 'in-progress',
    },
    placementDate: {
      type: Date,
    },
    offerDetails: {
      ctc: {
        type: Number,
      },
      joiningDate: {
        type: Date,
      },
      location: {
        type: String,
      },
    },
  },
  {
    timestamps: true,
  }
)

// Index for efficient queries
PlacementSchema.index({ studentId: 1, jobId: 1 })
PlacementSchema.index({ batch: 1 })
PlacementSchema.index({ status: 1 })

export const Placement = mongoose.model<IPlacement>('Placement', PlacementSchema)

