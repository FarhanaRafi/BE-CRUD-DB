import express from "express";
import createHttpError from "http-errors";
import BlogsModel from "./model.js";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { getPDFReadableStream } from "../../lib/pdf-tools.js";
import { pipeline } from "stream";
import q2m from "query-to-mongo";
import AuthorsModel from "../authors/model.js";
import { basicAuthMiddleware } from "../../lib/auth/basic.js";
import { JWTAuthMiddleware } from "../../lib/auth/jwt.js";

const blogsRouter = express.Router();

blogsRouter.post("/", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const newBlog = new BlogsModel(req.body);
    newBlog.authors = [...newBlog.authors, req.author._id];
    const { _id } = await newBlog.save();
    res.status(201).send({ _id });
  } catch (error) {
    next(error);
  }
});
blogsRouter.get("/me/stories", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const blogs = await BlogsModel.find({
      authors: { $in: [req.author._id] },
    }).populate("authors");
    res.send(blogs);
  } catch (error) {
    next(error);
  }
});

blogsRouter.get("/", JWTAuthMiddleware, async (req, res, next) => {
  try {
    console.log("req.query", req.query);
    console.log("q2m", q2m(req.query));
    const mongoQuery = q2m(req.query);
    const blogs = await BlogsModel.find(
      mongoQuery.criteria,
      mongoQuery.options.fields
    )
      .limit(mongoQuery.options.limit)
      .skip(mongoQuery.options.skip)
      .sort(mongoQuery.options.sort)
      .populate({ path: "authors", select: "name" });
    const total = await BlogsModel.countDocuments(mongoQuery.criteria);
    res.send({
      links: mongoQuery.links(process.env.LINK_URL + "/blogPosts", total),
      total,
      numberOfPages: Math.ceil(total / mongoQuery.options.limit),
      blogs,
    });
  } catch (error) {
    next(error);
  }
});

blogsRouter.get("/:blogId", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const blog = await BlogsModel.findById(req.params.blogId).populate({
      path: "authors",
      select: "name surname avatar",
    });
    if (blog) {
      res.send(blog);
    } else {
      next(createHttpError(404, `Blog with id ${req.params.blogId} not found`));
    }
  } catch (error) {
    next(error);
  }
});
blogsRouter.put("/:blogId", JWTAuthMiddleware, async (req, res, next) => {
  try {
    // const updatedBlog = await BlogsModel.findByIdAndUpdate(
    //   req.params.blogId,
    //   req.body,
    //   { new: true, runValidators: true }
    // );
    const blog = await BlogsModel.findById(req.params.blogId);
    if (blog.authors.includes(req.author._id) || req.author.role === "Admin") {
      const updatedBlog = await BlogsModel.findByIdAndUpdate(
        req.params.blogId,
        req.body,
        { new: true, runValidators: true }
      );
      if (updatedBlog) {
        res.send(updatedBlog);
      } else {
        next(createHttpError(403, `You are not authorized`));
      }
    }
  } catch (error) {
    next(error);
  }
});
blogsRouter.delete("/:blogId", JWTAuthMiddleware, async (req, res, next) => {
  try {
    // const deletedBlog = await BlogsModel.findByIdAndDelete(req.params.blogId);
    const blog = await BlogsModel.findById(req.params.blogId);
    if (blog.authors.includes(req.author._id) || req.author.role === "Admin") {
      const deletedBlog = await BlogsModel.findByIdAndUpdate(
        req.params.blogId,
        req.body,
        { new: true, runValidators: true }
      );
      if (deletedBlog) {
        res.status(204).send();
      } else {
        next(
          createHttpError(404, `Blog with id ${req.params.blogId} not found`)
        );
      }
    }
  } catch (error) {
    next(error);
  }
});

const cloudinaryUploader = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "BE-DB/blogs",
    },
  }),
}).single("cover");

blogsRouter.post(
  "/:blogId/uploadCover",
  cloudinaryUploader,
  async (req, res, next) => {
    try {
      console.log(req.file, "req file");
      const blog = await BlogsModel.findById(req.params.blogId);
      blog.cover = req.file.path;
      await blog.save();
      if (blog) {
        res.send({ message: "File uploaded successfully" });
      } else {
        next(
          createHttpError(404, `Blog with id ${req.params.blogId} not found`)
        );
      }
    } catch (error) {
      next(error);
    }
  }
);

blogsRouter.get("/:blogId/pdf", async (req, res, next) => {
  try {
    res.setHeader("Content-Disposition", "attachment; filename=blog.pdf");
    const blog = await BlogsModel.findById(req.params.blogId);
    const source = await getPDFReadableStream(blog);
    const destination = res;
    pipeline(source, destination, (err) => {
      if (err) {
        console.log(err);
      }
    });
  } catch (error) {
    next(error);
  }
});

blogsRouter.post("/:blogId/comments", async (req, res, next) => {
  try {
    const newComment = req.body;
    const commentToInsert = {
      ...newComment,
    };
    const updatedBlog = await BlogsModel.findByIdAndUpdate(
      req.params.blogId,
      {
        $push: { comments: commentToInsert },
      },
      { new: true, runValidators: true }
    );
    if (updatedBlog) {
      res.send(updatedBlog);
    } else {
      next(createHttpError(404, `Blog with id ${req.params.blogId} not found`));
    }
  } catch (error) {
    next(error);
  }
});

blogsRouter.get("/:blogId/comments", async (req, res, next) => {
  try {
    const comment = await BlogsModel.findById(req.params.blogId);
    if (comment) {
      res.send(comment.comments);
    } else {
      next(createHttpError(404, `Blog with id ${req.params.blogId} not found`));
    }
  } catch (error) {
    next(error);
  }
});

blogsRouter.get("/:blogId/comments/:commentId", async (req, res, next) => {
  try {
    const comment = await BlogsModel.findById(req.params.blogId);
    if (comment) {
      console.log(comment.comments, "comment");
      const selectedComment = comment.comments.find(
        (c) => c._id.toString() === req.params.commentId
      );
      if (selectedComment) {
        res.send(selectedComment);
      } else {
        next(
          createHttpError(
            404,
            `Comment with id ${req.params.commentId} not found`
          )
        );
      }
    } else {
      next(createHttpError(404, `Blog with id ${req.params.blogId} not found`));
    }
  } catch (error) {
    next(error);
  }
});

blogsRouter.put("/:blogId/comments/:commentId", async (req, res, next) => {
  try {
    const comment = await BlogsModel.findById(req.params.blogId);
    if (comment) {
      const index = comment.comments.findIndex(
        (c) => c._id.toString() === req.params.commentId
      );
      if (index !== -1) {
        comment.comments[index] = {
          ...comment.comments[index].toObject(),
          ...req.body,
        };
        await comment.save();
        res.send(comment);
      } else {
        next(
          createHttpError(
            404,
            `Comment with id ${req.params.commentId} not found`
          )
        );
      }
    } else {
      next(createHttpError(404, `Blog with id ${req.params.blogId} not found`));
    }
  } catch (error) {
    next(error);
  }
});
blogsRouter.delete("/:blogId/comments/:commentId", async (req, res, next) => {
  try {
    const updatedBlog = await BlogsModel.findByIdAndUpdate(
      req.params.blogId,
      { $pull: { comments: { _id: req.params.commentId } } },
      { new: true, runValidators: true }
    );
    if (updatedBlog) {
      res.send(updatedBlog);
    } else {
      next(createHttpError(404, `Blog with id ${req.params.blogId} not found`));
    }
  } catch (error) {
    next(error);
  }
});

blogsRouter.post("/:blogId/likes", async (req, res, next) => {
  try {
    const { authorId } = req.body;
    const blog = await BlogsModel.findById(req.params.blogId);
    if (!blog)
      return next(
        createHttpError(404, `Blog with id ${req.params.blogId} not found`)
      );
    const likes = await AuthorsModel.findById(authorId);
    console.log(likes, "likes");
    if (!likes)
      return next(createHttpError(404, `Author with id ${authorId} not found`));
    console.log(authorId, "author");
    if (blog.likes.includes(authorId)) {
      const deleteLikes = await BlogsModel.findOneAndUpdate(
        { _id: req.params.blogId },
        { $pull: { likes: authorId } },
        { new: true, runValidators: true }
      );
      res.send({
        likedArray: deleteLikes.likes,
        length: deleteLikes.likes.length,
      });
    } else {
      const updatedBlog = await BlogsModel.findOneAndUpdate(
        { _id: req.params.blogId },
        { $push: { likes: authorId } },
        { new: true, runValidators: true, upsert: true }
      );
      console.log(updatedBlog, "+++++++++");
      res.send({
        likedArray: updatedBlog.likes,
        length: updatedBlog.likes.length,
      });
    }
  } catch (error) {
    next(error);
  }
});

export default blogsRouter;
