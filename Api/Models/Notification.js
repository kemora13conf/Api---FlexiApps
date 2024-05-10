import mongoose from "mongoose";

const { Schema, models, model } = mongoose;

// creating the schema for the notification model
const notificationSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

notificationSchema.virtual("idNotif", function () {
  return this._id;
 } )

export default models.Notification || model("Notification", notificationSchema);
