import express, { Request, Response } from "express";
import bcryptjs from "bcryptjs";
import jsonwentoken from "jsonwebtoken";
import { query } from "../lib/databse";
import dotenv from "dotenv";

const router = express.Router();
dotenv.config();

interface RequestBody {
  username: string;
  password: string;
  name: string;
}

router.post("/register", async (req: Request, res: Response) => {
  const { username, password, name } = req.body as RequestBody;
  try {
    const userExists = await query("SELECT * FROM users WHERE username = $1", [
      username,
    ]);
    if (userExists.rows.length) return res.send("This username is taken");
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);
    const newUser = await query(
      "INSERT INTO users(username,password,name) VALUES($1,$2,$3) RETURNING *",
      [username, hashedPassword, name]
    );
    res.send(newUser.rows[0]);
  } catch (error) {
    console.log(error);
  }
});

router.post("/login", async (req: Request, res: Response) => {
  const { username, password } = req.body as Omit<RequestBody, "name">;
  const user = await query("SELECT * FROM users WHERE username = $1", [
    username,
  ]);
  if (user.rows.length === 0)
    return res
      .status(400)
      .send(`There is no such user with the username: ${username}`);

  const comparePassword = await bcryptjs.compare(
    password,
    user.rows[0].password
  );
  if (!comparePassword) return res.status(400).send("Invalid password");

  const token = jsonwentoken.sign(
    { id: user.rows[0].id },
    process.env.TOKEN_SECRET!
  );

  res.header("auth-token", token).send({ "auth-token": token });
});

export default router;
