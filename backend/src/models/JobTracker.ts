import mongoose, { Schema, Document } from 'mongoose'

export interface IJobTracker extends Document {
  userId: mongoose.Types.ObjectId
  jobId: mongoose.Types.ObjectId
  status: 'saved' | 'applied' | 'interviewing' | 'rejected' | 'accepted'
  notes?: string
  appliedDate?: Date
  createdAt: Date
  updatedAt: Date
}

const JobTrackerSchema = new Schema<IJobTracker>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    status: {
      type: String,
      enum: ['saved', 'applied', 'interviewing', 'rejected', 'accepted'],
      default: 'saved',
    },
    notes: {
      type: String,
    },
    appliedDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
)

// Index to prevent duplicate job saves
JobTrackerSchema.index({ userId: 1, jobId: 1 }, { unique: true })

export const JobTracker = mongoose.model<IJobTracker>('JobTracker', JobTrackerSchema)

