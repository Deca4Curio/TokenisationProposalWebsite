import type { Request, Response, NextFunction } from "express";

export function validateApiSecret(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const secret = req.headers["x-api-secret"];
  const expected = process.env.API_SECRET;

  if (!expected) {
    res.status(500).json({ error: "API_SECRET not configured" });
    return;
  }

  if (secret !== expected) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  next();
}
