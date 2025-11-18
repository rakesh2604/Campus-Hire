import mongoose, { Schema, Document } from 'mongoose'

export interface IJob extends Document {
  title: string
  description: string
  company: string
  location: string
  type: 'full-time' | 'part-time' | 'contract' | 'internship'
  workMode?: 'office' | 'remote' | 'hybrid'
  salary?: {
    min: number
    max: number
    currency: string
  }
  salaryText?: string // e.g., "6.7 LPA" or "Competitive salary package"
  experienceLevel?: string // e.g., "Entry-level (0-2 years of experience)"
  experienceRange?: {
    minYears: number
    minMonths: number
    maxYears: number
    maxMonths: number
  }
  aboutCompany?: string
  responsibilities?: string[]
  keyQualifications?: string[]
  teamEnvironment?: string[]
  companyCulture?: string[]
  requirements: string[]
  postedBy: mongoose.Types.ObjectId
  status: 'active' | 'closed' | 'draft'
  createdAt: Date
  updatedAt: Date
}

const JobSchema = new Schema<IJob>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'internship'],
      required: true,
    },
    salary: {
      min: {
        type: Number,
      },
      max: {
        type: Number,
      },
      currency: {
        type: String,
        default: 'INR',
      },
    },
    salaryText: {
      type: String,
    },
    workMode: {
      type: String,
      enum: ['office', 'remote', 'hybrid'],
    },
    experienceLevel: {
      type: String,
    },
    experienceRange: {
      minYears: {
        type: Number,
        default: 0,
      },
      minMonths: {
        type: Number,
        default: 0,
      },
      maxYears: {
        type: Number,
        default: 0,
      },
      maxMonths: {
        type: Number,
        default: 0,
      },
    },
    aboutCompany: {
      type: String,
    },
    responsibilities: {
      type: [String],
      default: [],
    },
    keyQualifications: {
      type: [String],
      default: [],
    },
    teamEnvironment: {
      type: [String],
      default: [],
    },
    companyCulture: {
      type: [String],
      default: [],
    },
    requirements: {
      type: [String],
      default: [],
    },
    postedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'closed', 'draft'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
)

export const Job = mongoose.model<IJob>('Job', JobSchema)

