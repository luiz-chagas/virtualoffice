import { HttpError } from "http-errors";
import express, { NextFunction, Response, Request, Router } from "express";
import cookieParser from "cookie-parser";
import path from "path";

export const makeApp = () => {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());

  app.use(
    "/phaser",
    express.static(path.join(__dirname, "..", "..", "phaser", "dist"))
  );
  app.use(express.static(path.join(__dirname, "..", "..", "office", "build")));

  // default error handler
  app.use(function (
    err: HttpError,
    _req: Request,
    res: Response,
    _next: NextFunction
  ) {
    res.status(err.status || 500);
    res.send(err);
  });

  const registerRouter = (path: string, router: Router) => {
    app.use(path, router);
  };

  return { app, registerRouter };
};
