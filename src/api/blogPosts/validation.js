import { checkSchema, validationResult } from "express-validator";
import createHttpError from "http-errors";

const blogsSchema = {
  category: {
    in: ["body"],
    isString: {
      errorMessage: "Category is a mandatory and needs to be in string",
    },
  },
  title: {
    in: ["body"],
    isString: {
      errorMessage: "Title is a mandatory and needs to be in string",
    },
  },
  "readTime.value": {
    in: ["body"],
    isNumeric: {
      errorMessage: "ReadTime.value is a mandatory and needs to be in number",
    },
  },
  "readTime.unit": {
    in: ["body"],
    isString: {
      errorMessage: "ReadTime.unit is a mandatory and needs to be in string",
    },
  },
  //   "author.name": {
  //     in: ["body"],
  //     isString: {
  //       errorMessage: "Author.name is a mandatory and needs to be in string",
  //     },
  //   },
  //   "author.avatar": {
  //     in: ["body"],
  //     isString: {
  //       errorMessage: "Author.avatar is a mandatory and needs to be in string",
  //     },
  //   },
  content: {
    in: ["body"],
    isString: {
      errorMessage: "Content is a mandatory and needs to be in string",
    },
  },
};

export const checkBlogSchema = checkSchema(blogsSchema);

export const triggerBadRequest = (req, res, next) => {
  const errors = validationResult(req);

  console.log(errors.array());

  if (errors.isEmpty()) {
    next();
  } else {
    next(
      createHttpError(400, "Errors during blog validation", {
        errorsList: errors.array(),
      })
    );
  }
};
