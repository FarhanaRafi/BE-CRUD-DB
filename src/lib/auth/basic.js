import createHttpError from "http-errors";
import atob from "atob";
import AuthorsModel from "../../api/authors/model.js";

export const basicAuthMiddleware = async (req, res, next) => {
  if (req.headers.authorization) {
    const credentials = atob(req.headers.authorization.split(" ")[1]);
    const [email, password] = credentials.split(":");
    const author = await AuthorsModel.checkCredentials(email, password);
    if (author) {
      req.author = author;
      next();
    } else {
      next(createHttpError(401, "Credentials are not ok!"));
    }
  } else {
    next(
      createHttpError(401, "Please provide credentials in Authorization header")
    );
  }
};
