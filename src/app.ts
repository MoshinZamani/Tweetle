import express, { Request, Response } from "express";
import { query } from "./lib/databse";
import userRoute from "./route/user";
import postRoute from "./route/post";

const PORT = process.env.PORT;

const app = express();
app.use(express.json());
app.use("/users", userRoute);
app.use("/posts", postRoute);

app.get("/", async (req: Request, res: Response) => {
  try {
    const { rows } = await query("SELECT * FROM users", []);
    if (!rows) res.send(`Empty talbe`);
    res.json(rows);
  } catch (error) {
    console.log(error);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
