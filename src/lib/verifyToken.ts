import { Request, Response, NextFunction } from "express";
import jsonwebtoken from "jsonwebtoken";
import dotenv from "dotenv";

// Make sure to call config to load the environment variables
dotenv.config();

interface JwtPayload {
  // Define the properties you expect from your JWT payload
  id: number;
  // Add more properties according to your payload structure
}
// types.d.ts

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload; // Use a more specific type if possible
    }
  }
}

const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers["auth-token"] as string;
  if (!token) {
    return res.status(401).send({ message: "Access denied!" });
  }

  try {
    const verified = jsonwebtoken.verify(
      token,
      process.env.TOKEN_SECRET as string
    ) as JwtPayload;
    req.user = verified; // This works because of your custom type declaration in types.d.ts
    next();
  } catch (error) {
    return res.status(401).send({ message: "Invalid token" });
  }
};

export default verifyToken;
