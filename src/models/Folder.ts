import mongoose, { Schema, Document, Model } from "mongoose";
import { getOrRegisterModel } from "@/lib/model-registry";

export interface IFolder extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  color: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FolderSchema = new Schema<IFolder>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "El usuario propietario es obligatorio"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "El nombre de la carpeta es obligatorio"],
      trim: true,
      maxlength: [60, "El nombre no puede superar los 60 caracteres"],
    },
    color: {
      type: String,
      default: "indigo",
      enum: ["indigo", "emerald", "amber", "rose", "purple", "sky"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: [200, "La descripción no puede superar los 200 caracteres"],
    },
  },
  {
    timestamps: true,
  }
);

// Unique compound index so a user cannot have two folders with the same name
FolderSchema.index({ userId: 1, name: 1 }, { unique: true });

const Folder: Model<IFolder> = getOrRegisterModel<IFolder>(
  "Folder",
  FolderSchema
);

export default Folder;
