import mongoose, { Schema, Document, Model } from "mongoose";
import { FileCategory } from "@/lib/file-utils";

export interface IFileItem extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  originalName: string;
  mimeType: string;
  category: FileCategory;
  size: number;
  fileData?: Buffer;
  description?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const FileItemSchema = new Schema<IFileItem>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "El usuario propietario es obligatorio"],
      index: true,
    },
    originalName: {
      type: String,
      required: [true, "El nombre del archivo es obligatorio"],
      trim: true,
    },
    mimeType: {
      type: String,
      required: [true, "El tipo MIME es obligatorio"],
    },
    category: {
      type: String,
      enum: ["pdf", "image", "word", "powerpoint", "other"],
      required: true,
      index: true,
    },
    size: {
      type: Number,
      required: [true, "El tamaño del archivo es obligatorio"],
    },
    fileData: {
      type: Buffer,
      required: false, // Optional if we project it out or fetch metadata only
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Composite index for fast listing of user's files ordered by creation date
FileItemSchema.index({ userId: 1, createdAt: -1 });
FileItemSchema.index({ userId: 1, category: 1 });

const FileItem: Model<IFileItem> =
  mongoose.models.FileItem ||
  mongoose.model<IFileItem>("FileItem", FileItemSchema);

export default FileItem;
