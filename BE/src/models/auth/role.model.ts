import mongoose, { Schema, Document } from "mongoose";
import { RoleKey, RoleStatus } from "@/types";
import { ROLE_KEYS, ROLE_STATUS } from "@/constants/roles";

export interface IRole extends Document {
  roleKey: RoleKey;
  roleName: string;
  description?: string | null;
  status: RoleStatus;
  permissions: string[]; // Array of permission keys
  createdAt: Date;
}

const RoleSchema = new Schema<IRole>(
  {
    roleKey: {
      type: String,
      required: true,
      unique: true,
      enum: Object.values(ROLE_KEYS),
    },
    roleName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(ROLE_STATUS),
      default: ROLE_STATUS.ACTIVE,
    },
    permissions: {
      type: [String],
      default: [],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false, // Only createdAt, no updatedAt
  }
);

export default mongoose.model<IRole>("Role", RoleSchema);
