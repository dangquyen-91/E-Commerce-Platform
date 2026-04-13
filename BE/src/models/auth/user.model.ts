import mongoose, { Schema, Document } from "mongoose";
import { UserStatus } from "@/types";

export interface IUser extends Document {
  roleId: mongoose.Types.ObjectId;
  email: string;
  passwordHash: string;
  fullName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  trustLevel: number;
  emailVerified: boolean;
  phoneVerified: boolean;
  status: UserStatus;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

const UserSchema = new Schema<IUser>(
  {
    roleId: {
      type: Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      default: null,
    },
    avatarUrl: {
      type: String,
      default: null,
    },
    trustLevel: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      required: true,
      enum: ["Active", "Locked", "Banned"],
      default: "Active",
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// Note: email index is automatically created by unique: true
UserSchema.index({ roleId: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ isDeleted: 1 });

export default mongoose.model<IUser>("User", UserSchema);
