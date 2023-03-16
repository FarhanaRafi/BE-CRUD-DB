import mongoose from "mongoose";

const { Schema, model } = mongoose;

const authorsSchema = new Schema(
  {
    name: { type: String, required: true },
    surname: { type: String, required: true },
    email: { type: String, required: true },
    dateOfBirth: { type: String },
    avatar: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

export default model("Author", authorsSchema);
