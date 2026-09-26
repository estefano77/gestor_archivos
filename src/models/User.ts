import mongoose, { Schema, Document, Model } from "mongoose";
import { getOrRegisterModel } from "@/lib/model-registry";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  avatarColor?: string;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "El nombre es requerido"],
      trim: true,
      maxlength: [60, "El nombre no puede exceder 60 caracteres"],
    },
    email: {
      type: String,
      required: [true, "El correo electrónico es requerido"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Por favor ingresa un correo electrónico válido",
      ],
    },
    password: {
      type: String,
      required: [true, "La contraseña es requerida"],
      minlength: [6, "La contraseña debe tener al menos 6 caracteres"],
    },
    avatarColor: {
      type: String,
      default: "#6366f1", // Indigo
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  {
    timestamps: true,
  }
);

// Registro seguro ante el hot-reload de Next.js (ver src/lib/model-registry.ts)
const User: Model<IUser> = getOrRegisterModel<IUser>("User", UserSchema);

export default User;
