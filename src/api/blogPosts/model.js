import mongoose from "mongoose";

const { Schema, model } = mongoose;

const commentSchema = new Schema(
  {
    comment: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5 },
    author: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

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
    comments: [commentSchema],
  },
  {
    timestamps: true,
  }
);

export default model("Blog", blogsSchema);
