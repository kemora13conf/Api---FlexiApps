import mongoose from "mongoose";
import bcrypt from "bcrypt";
import CryptoJS from "crypto-js";

const { Schema, models, model } = mongoose;

// List of roles
export const ROLES = {
  USER: "user",
  ADMIN: "admin",
  LIVREUR: "livreur",
};

export const LIVREUR_STATUS = {
  FREE: "free",
  BUSY: "busy",
};

const userSchema = new Schema(
  {
    fullname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    hashed_password: {
      type: String,
      required: true,
    },
    salt: {
      type: String,
    },
    role: {
      type: String,
      default: "user",
      enum: Object.values(ROLES),
    },
    phone: {
      type: String,
    },
    status: {
      type: String,
      enum: Object.values(LIVREUR_STATUS),
      default: LIVREUR_STATUS.FREE,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  try {
    if (!this.isModified("hashed_password")) return next();
    this.salt = await bcrypt.genSalt(10);
    this.hashed_password = CryptoJS.SHA256(
      this.hashed_password + this.salt
    ).toString();
    // if the user is not LIVREUR, remove the livreur status
    if (this.role !== ROLES.LIVREUR) {
      this.status = undefined;
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password
userSchema.methods = {
  isPasswordMatch: function (password) {
    return (
      CryptoJS.SHA256(password + this.salt).toString() === this.hashed_password
    );
  },
};

export default models.User || model("User", userSchema);
