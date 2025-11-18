import mongoose, { Schema, Document } from 'mongoose'

export interface IUser extends Document {
  email: string
  password?: string
  name: string
  role: 'candidate' | 'recruiter' | 'admin' | 'placement'
  googleId?: string
  // Profile fields
  profilePicture?: string
  workExperience?: number
  graduationYear?: string
  currentLocation?: string
  description?: string
  portfolioLink?: string
  availableToJoin?: string
  preferredLocations?: string[]
  companyType?: string[]
  linkedin?: string
  github?: string
  phone?: string // Phone number for WhatsApp notifications
  currentCTC?: number
  desiredCTCMin?: number
  desiredCTCMax?: number
  resume?: string
  dismissedJobs?: Array<{
    jobId: mongoose.Types.ObjectId
    reason?: string
    dismissedAt: Date
  }>
  // Arrays for profile sections
  workExperiences?: Array<{
    title: string
    company: string
    location?: string
    duration?: string
    description: string
    startDate?: string
    endDate?: string
  }>
  projects?: Array<{
    name: string
    description: string
    link?: string
    technologies?: string[]
  }>
  educations?: Array<{
    degree: string
    institution: string
    location?: string
    startDate?: string
    endDate?: string
    fieldOfStudy?: string
  }>
  certificates?: Array<{
    name: string
    issuer: string
    date: string
    link?: string
  }>
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: function (this: IUser) {
        return !this.googleId
      },
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['candidate', 'recruiter', 'admin', 'placement'],
      default: 'candidate',
    },
    googleId: {
      type: String,
      sparse: true,
    },
    // Profile fields
    profilePicture: {
      type: String,
    },
    workExperience: {
      type: Number,
      default: 0,
    },
    graduationYear: {
      type: String,
    },
    currentLocation: {
      type: String,
    },
    description: {
      type: String,
    },
    portfolioLink: {
      type: String,
    },
    availableToJoin: {
      type: String,
    },
    preferredLocations: {
      type: [String],
      default: [],
    },
    companyType: {
      type: [String],
      default: [],
    },
    linkedin: {
      type: String,
    },
    github: {
      type: String,
    },
    phone: {
      type: String,
    },
    currentCTC: {
      type: Number,
    },
    desiredCTCMin: {
      type: Number,
    },
    desiredCTCMax: {
      type: Number,
    },
    resume: {
      type: String,
    },
    dismissedJobs: [{
      jobId: {
        type: Schema.Types.ObjectId,
        ref: 'Job',
        required: true,
      },
      reason: {
        type: String,
      },
      dismissedAt: {
        type: Date,
        default: Date.now,
      },
    }],
    // Arrays for profile sections
    workExperiences: [{
      title: String,
      company: String,
      location: String,
      duration: String,
      description: String,
      startDate: String,
      endDate: String,
    }],
    projects: [{
      name: String,
      description: String,
      link: String,
      technologies: [String],
    }],
    educations: [{
      degree: String,
      institution: String,
      location: String,
      startDate: String,
      endDate: String,
      fieldOfStudy: String,
    }],
    certificates: [{
      name: String,
      issuer: String,
      date: String,
      link: String,
    }],
  },
  {
    timestamps: true,
  }
)

export const User = mongoose.model<IUser>('User', UserSchema)

