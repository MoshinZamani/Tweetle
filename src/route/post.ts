import express, { Request, Response } from "express";
import { query } from "../lib/databse";
import verifyToken from "../lib/verifyToken";

const router = express.Router();

// Get all posts
router.get("/", verifyToken, async (req: Request, res: Response) => {
  const sqlQuery = "SELECT * FROM posts";
  try {
    const { rows } = await query(sqlQuery);
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json(error);
  }
});

// Get a specific post by id
router.get("/:id", verifyToken, async (req: Request, res: Response) => {
  const { id } = req.params;
  const sqlQuery = "SELECT * FROM posts WHERE id = $1";
  try {
    const { rows } = await query(sqlQuery, [id]);
    if (rows.length === 0) return res.status(404).send("Post not found");

    return res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json(error);
  }
});

router.get(
  "/active/:topic",
  verifyToken,
  async (req: Request, res: Response) => {
    const { topic } = req.params;
    try {
      // Assuming your posts table has columns: id, topic, likes, etc.
      const sqlQuery = `
        SELECT * FROM posts
        WHERE topic = $1
        ORDER BY likes DESC
        LIMIT 1;
      `;
      const { rows } = await query(sqlQuery, [topic]);
      if (rows.length === 0) return res.status(404).send("Post not found");
      return res.json(rows[0]);
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).send(error);
    }
  }
);

// Get posts by topic
router.get(
  "/topic/:topic",
  verifyToken,
  async (req: Request, res: Response) => {
    const { topic } = req.params;
    const sqlQuery = "SELECT * FROM posts WHERE topic = $1";
    try {
      const posts = await query(sqlQuery, [topic.toLowerCase()]);
      res.status(200).json(posts.rows);
    } catch (error) {
      res.status(500).json({ message: "Error fetching posts by topic", error });
    }
  }
);

// Get all expired posts per topic
router.get(
  "/expired/:topic",
  verifyToken,
  async (req: Request, res: Response) => {
    const { topic } = req.params;
    const sqlQuery = "SELECT * FROM posts WHERE live = false and topic = $1";
    try {
      const { rows } = await query(sqlQuery, [topic]);
      if (rows.length === 0)
        return res.send(`No expired posts with the topic ${topic}`);
      return res.send(rows);
    } catch (error) {
      res.send(error);
    }
  }
);

// Get active post per topic
router.get(
  "/active/:topic",
  verifyToken,
  async (req: Request, res: Response) => {
    const { topic } = req.params;
    const sqlQuery = "SELECT * FROM posts WHERE live = true and topic = $1";
    try {
      const { rows } = await query(sqlQuery, [topic]);
      if (rows.length === 0)
        return res.send(`No expired posts with the topic ${topic}`);
      return res.send(rows);
    } catch (error) {
      res.send(error);
    }
  }
);

router.put("/operations", verifyToken, async (req: Request, res: Response) => {
  //   if (Object.keys(req.body).length === 0) return res.send("Nothing to update");
  const { id, like, dislike, comment } = req.body;
  const sqlQuery = "SELECT * FROM posts WHERE id = $1";
  try {
    const { rows, rowCount } = await query(sqlQuery, [id]);
    if (rowCount === 0) return res.status(404).send(`No post with id: ${id}`);

    const post = rows[0];
    if (!post.live)
      return res.send(
        "This post is not active anymore and can not accept any interactions"
      );

    const updateQuery =
      "UPDATE posts SET likes = $1, dislikes = $2, comments = $3 WHERE id = $4 RETURNING *";
    const updateValues = [
      post.likes + (like ? 1 : 0), // Assuming likes and dislikes are mutually exclusive
      post.dislikes + (dislike ? 1 : 0),
      comment ? [...post.comments, comment] : post.comments, // This assumes comments are stored in an array-like structure
      id,
    ];

    const updatedPostQuery = await query(updateQuery, updateValues);
    const updatedPost = updatedPostQuery.rows[0];

    res.json(updatedPost);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).send(error);
  }
});

router.put("/:id", verifyToken, async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  const updateKeys = Object.keys(updates);
  const updateValues = Object.values(updates);

  if (updateKeys.length === 0) {
    return res.status(400).send("Nothing to update");
  }

  let setClause = updateKeys
    .map((key, index) => `${key} = $${index + 2}`)
    .join(", ");
  let sqlQuery = `UPDATE posts SET ${setClause} WHERE id = $1 RETURNING *;`;

  try {
    const { rows, rowCount } = await query(sqlQuery, [id, ...updateValues]);
    if (rowCount === 0) {
      return res.status(404).send(`Could not find post with id ${id}`);
    }
    res.send(rows[0]);
  } catch (error) {
    console.error(error);
  }
});

router.post("/", verifyToken, async (req: Request, res: Response) => {
  const { title, topic, message, ownerId, expiry } = req.body;

  const timeStamp = new Date().toDateString();

  const sqlQuery =
    "INSERT INTO posts(title,topic,message,timestamp,ownerid,expiry) VALUES($1,$2,$3,$4,$5,$6) RETURNING *";
  try {
    const { rows } = await query(sqlQuery, [
      title,
      topic,
      message,
      timeStamp,
      ownerId,
      expiry,
    ]);
    res.send(rows[0]);
  } catch (error) {
    console.log(error);
  }
});

router.delete("/:id", verifyToken, async (req: Request, res: Response) => {
  const { id } = req.params;
  const sqlQuery = "DELETE FROM posts WHERE id = $1";
  try {
    const { rows, rowCount } = await query(sqlQuery, [id]);
    if (rowCount === 0) return res.send(`No post with id ${id} was found`);
    res.send(rows[0]);
  } catch (error) {
    console.error(error);
  }
});
// Add more routes here...

export default router;
