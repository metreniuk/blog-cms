import { Router } from "express";
import { supabase } from "../config/index.js";

const router = Router();

// Get user
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data: users, error } = await supabase.rpc("get_user_by_id", {
      user_id: id,
    });
    if (error) throw new Error("User not found");
    res.json(users[0]);
  } catch (error) {
    next(error);
  }
});

// Get user posts
router.get("/:id/posts", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data: posts, error } = await supabase.rpc("get_user_posts", {
      user_id: id,
    });
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

    const { data: user, error } = await supabase.rpc("update_user", {
      user_id: id,
      new_username: username,
      new_email: email,
    });

    if (error) throw new Error("User not found");
    res.json(user);
  } catch (error) {
    next(error);
  }
});

export default router;
