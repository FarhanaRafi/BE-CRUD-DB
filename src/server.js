import Express from "express";
import listEndpoints from "express-list-endpoints";
import cors from "cors";
import mongoose from "mongoose";
import {
  badRequestHandler,
  unauthorizedHandler,
  notfoundHandler,
  genericErrorHandler,
  forbiddenErrorHandler,
} from "./errorHandlers.js";
import blogsRouter from "./api/blogPosts/index.js";
import authorsRouter from "./api/authors/index.js";
import passport from "passport";
import googleStrategy from "./lib/auth/googleOauth.js";

const server = Express();
const port = process.env.PORT;
const whitelist = [process.env.FE_DEV_URL, process.env.FE_PROD_URL];

passport.use("google", googleStrategy);

server.use(
  cors({
    origin: (currentOrigin, corsNext) => {
      if (!currentOrigin || whitelist.indexOf(currentOrigin) !== -1) {
        corsNext(null, true);
      } else {
        corsNext(
          createHttpError(
            400,
            `origin ${currentOrigin} is not in the whitelist`
          )
        );
      }
    },
  })
);

server.use(Express.json());
server.use(passport.initialize());

server.use("/blogPosts", blogsRouter);
server.use("/authors", authorsRouter);

server.use(badRequestHandler);
server.use(unauthorizedHandler);
server.use(forbiddenErrorHandler);
server.use(notfoundHandler);
server.use(genericErrorHandler);

mongoose.connect(process.env.MONGO_URL);

mongoose.connection.on("connected", () => {
  console.log("successfully connected");
  server.listen(port, () => {
    console.table(listEndpoints(server));
    console.log(`Server is running on port ${port}`);
  });
});
