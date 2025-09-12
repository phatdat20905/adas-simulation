// models/Support.js
import mongoose from "mongoose";

const SupportSchema = new mongoose.Schema(
  {
    name:    { type: String, required: true, trim: true },
    email:   { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    status:  { type: String, enum: ["pending", "resolved"], default: "pending" },
  },
  { timestamps: true }
);

export default mongoose.model("Support", SupportSchema);
