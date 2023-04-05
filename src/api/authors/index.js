import express from "express";
import createHttpError from "http-errors";
import { adminOnlyMiddleware } from "../../lib/auth/admin.js";
import { basicAuthMiddleware } from "../../lib/auth/basic.js";
import { JWTAuthMiddleware } from "../../lib/auth/jwt.js";
import { createAccessToken } from "../../lib/auth/tools.js";
import AuthorsModel from "./model.js";
// import { createAccessToken } from "../../lib/auth/tools.js"

const authorsRouter = express.Router();

authorsRouter.post("/register", async (req, res, next) => {
  try {
    const newAuthor = new AuthorsModel(req.body);
    const { _id } = await newAuthor.save();
    res.status(201).send({ _id });
  } catch (error) {
    next(error);
  }
});
authorsRouter.get(
  "/",
  JWTAuthMiddleware,
  // basicAuthMiddleware,
  // adminOnlyMiddleware,
  async (req, res, next) => {
    try {
      const authors = await AuthorsModel.find();
      res.send(authors);
    } catch (error) {
      next(error);
    }
  }
);
authorsRouter.get("/:authorId", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const author = await AuthorsModel.findById(req.params.authorId);
    if (author) {
      res.send(author);
    } else {
      next(
        createHttpError(404, `Author with id ${req.params.authorId} not found`)
      );
    }
  } catch (error) {
    next(error);
  }
});
authorsRouter.put("/:authorId", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const updatedAuthor = await AuthorsModel.findByIdAndUpdate(
      req.params.authorId,
      req.body,
      { new: true, runValidators: true }
    );
    if (updatedAuthor) {
      res.send(updatedAuthor);
    } else {
      next(
        createHttpError(404, `Author with id ${req.params.authorId} not found`)
      );
    }
  } catch (error) {
    next(error);
  }
});
authorsRouter.delete(
  "/:authorId",
  JWTAuthMiddleware,
  async (req, res, next) => {
    try {
      const deletedAuthor = await AuthorsModel.findByIdAndDelete(
        req.params.authorId
      );
      if (deletedAuthor) {
        res.status(204).send();
      } else {
        next(
          createHttpError(
            404,
            `Author with id ${req.params.authorId} not found`
          )
        );
      }
    } catch (error) {
      next(error);
    }
  }
);

authorsRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const author = await AuthorsModel.checkCredentials(email, password);
    if (author) {
      const payload = { _id: author._id, role: author.role };
      const accessToken = await createAccessToken(payload);
      res.send({ accessToken });
    } else {
      next(createHttpError(401, "Credentials are not ok!"));
    }
  } catch (error) {
    next(error);
  }
});

export default authorsRouter;
