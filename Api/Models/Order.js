import monogoose from "mongoose";

const { Schema, models, model } = monogoose;

// Array of possible order statuses
export const ORDER_STATUSES = {
  BASKET: "basket",
  CONFIRMED: "confirmed",
  LIVRAISON: "livraison",
  DEPOSED: "deposed",
};

// creating the schema for the order model
const orderSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    products: [
      {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
    ],
    status: {
      type: String,
      enum: Object.values(ORDER_STATUSES),
      lowercase: true,
      trim: true,
      default:  ORDER_STATUSES.BASKET,
    },
    total: {
      type: Number,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    livreur: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);


export default models.Order || model("Order", orderSchema);