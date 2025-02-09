import { Router } from "express";
import { supabase } from "../config/index.js";

const router = Router();

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
      .select("*")
      .eq("author_id", id);

    if (error) throw new Error(error.message);
    res.json(posts);
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
