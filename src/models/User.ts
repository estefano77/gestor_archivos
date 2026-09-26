import mongoose, { Schema, Document, Model } from "mongoose";
import { getOrRegisterModel } from "@/lib/model-registry";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  /** Ausente en las cuentas creadas con Google: no hay contraseña que guardar. */
  password?: string;
  /** "local" (correo y contraseña) o "google". */
  provider?: "local" | "google";
  /** Identificador estable del proveedor. En Google es el claim `sub`. */
  providerId?: string;
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
        // El TLD admite 2 o más caracteres. Antes era `{2,3}`, que rechazaba
        // dominios válidos como `.info` (4) o `.museum` (6) y por tanto habría
        // bloqueado el registro con cuentas de Google que los usen.
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
        "Por favor ingresa un correo electrónico válido",
      ],
    },
    password: {
      type: String,
      // Opcional: las cuentas de Google no tienen contraseña. Quien se registra
      // con correo sigue teniendo que cumplir la validación del endpoint.
      required: false,
      minlength: [6, "La contraseña debe tener al menos 6 caracteres"],
    },
    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    providerId: {
      type: String,
      default: undefined,
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

// Una misma cuenta de Google no debe poder vincularse dos veces.
UserSchema.index({ provider: 1, providerId: 1 }, { sparse: true });

// Registro seguro ante el hot-reload de Next.js (ver src/lib/model-registry.ts)
const User: Model<IUser> = getOrRegisterModel<IUser>("User", UserSchema);

export default User;
