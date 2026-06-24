import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_PASSWORD } from "./config.js";

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const bearer = req.headers.authorization;
  if (!bearer || !bearer.startsWith("Bearer ")) {
    return res.status(403).json({ message: "You are not logged in" });
  }
  const token = bearer.split(" ")[1] as string;
  try {
    const payload = jwt.verify(token, JWT_PASSWORD);
    // @ts-ignore
    req.id = payload.id;
    next();
  } catch (e) {
    return res.status(403).json({
      message: "You are not logged in",
    });
  }
}
