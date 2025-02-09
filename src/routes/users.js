import { Router } from "express";
import { supabase, mongodb } from "../config/index.js";

const router = Router();

// Get all users
router.get("/", async (req, res, next) => {
  try {
    const { data: users, error } = await supabase.from("users").select("*");

    if (error) throw new Error(error.message);
    res.json(users);
  } catch (error) {
    next(error);
  }
});

// Get user
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw new Error("User not found");
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Get user posts
router.get("/:id/posts", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data: posts, error } = await supabase
      .from("posts")
      .select(
        `
        *,
        author:users(id, username)
      `
      )
      .eq("author_id", id);

    if (error) throw new Error(error.message);

    // Get content from MongoDB for each post
    const postsWithContent = await Promise.all(
      posts.map(async (post) => {
        const content = await mongodb
          .collection("posts")
          .findOne({ _id: post.id });
        return { ...post, content: content?.content };
      })
    );

    res.json(postsWithContent);
  } catch (error) {
    next(error);
  }
});

// Update user
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { username, email } = req.body;

    // Ensure user can only update their own profile
    if (id !== req.user.id) {
      throw new Error("Forbidden");
    }

    const { data: user, error } = await supabase
      .from("users")
      .update({ username, email, updated_at: new Date() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error("User not found");
    res.json(user);
  } catch (error) {
    next(error);
  }
});

export default router;
