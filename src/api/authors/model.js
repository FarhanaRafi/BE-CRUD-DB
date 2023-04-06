import mongoose from "mongoose";
import bcrypt from "bcrypt";

const { Schema, model } = mongoose;

const authorsSchema = new Schema(
  {
    name: { type: String, required: true },
    surname: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: false },
    dateOfBirth: { type: String },
    avatar: { type: String },
    role: {
      type: String,
      required: true,
      enum: ["admin", "user"],
      default: "user",
    },
    googleId: { type: String },
  },
  {
    timestamps: true,
  }
);

authorsSchema.pre("save", async function () {
  const newAuthorData = this;
  if (newAuthorData.isModified("password")) {
    const plainPW = newAuthorData.password;
    const hash = await bcrypt.hash(plainPW, 11);
    newAuthorData.password = hash;
  }
});

authorsSchema.methods.toJSON = function () {
  const currentAuthor = this.toObject();
  delete currentAuthor.password;
  delete currentAuthor._v;
  return currentAuthor;
};

authorsSchema.static("checkCredentials", async function (email, password) {
  const author = await this.findOne({ email });
  if (author) {
    const passwordMatch = await bcrypt.compare(password, author.password);

    if (passwordMatch) {
      return author;
    } else {
      return null;
    }
  } else {
    return null;
  }
});

export default model("Author", authorsSchema);
