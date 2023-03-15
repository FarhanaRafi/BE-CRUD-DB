import mongoose from "mongoose";

const { Schema, model } = mongoose;

const blogsSchema = new Schema(
  {
    category: { type: String, required: true },
    title: { type: String, required: true },
    cover: { type: String },
    readTime: {
      value: { type: Number, required: true },
      unit: { type: String, required: true },
    },
    author: {
      name: { type: String, required: true },
      avatar: { type: String },
    },
    content: { type: String, required: true },
    comments: [
      {
        comment: { type: String, required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        createdAt: Date,
        updatedAt: Date,
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default model("Blog", blogsSchema);
