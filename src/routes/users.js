import { Router } from "express";
import { redis, config, supabase } from "../config/index.js";

const router = Router();

// Get user
router.get("/:id", async (req, res, next) => {
  const key = `cache:${req.originalUrl}`;
  console.log(`Checking cache: ${key}`);

  try {
    // Try to get from cache
    const cachedData = await redis.get(key);
    if (cachedData) {
      console.log(`Cache hit: ${key}`);
      return res.json(JSON.parse(cachedData));
    }
    console.log(`Cache miss: ${key}`);

    // Get user from Supabase
    const { id } = req.params;
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw new Error("User not found");

    // Cache and send response
    await redis.set(key, JSON.stringify(user), { ex: config.cacheExpiry });
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Get user posts
router.get("/:id/posts", async (req, res, next) => {
  const key = `cache:${req.originalUrl}`;
  console.log(`Checking cache: ${key}`);

  try {
    // Try to get from cache
    const cachedData = await redis.get(key);
    if (cachedData) {
      console.log(`Cache hit: ${key}`);
      return res.json(JSON.parse(cachedData));
    }
    console.log(`Cache miss: ${key}`);

    // Get posts from Supabase
    const { id } = req.params;
    const { data: posts, error } = await supabase
      .from("posts")
      .select(
        `
        *,
        tags:post_tags(tag:tags(name))
      `
      )
      .eq("author_id", id);

    if (error) throw new Error(error.message);

    // Cache and send response
    await redis.set(key, JSON.stringify(posts), { ex: config.cacheExpiry });
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

    // Clear user cache
    const cachePattern = `cache:/api/users/${id}*`;
    const keys = await redis.keys(cachePattern);
    if (keys.length > 0) await redis.del(...keys);

    res.json(user);
  } catch (error) {
    next(error);
  }
});

export default router;
