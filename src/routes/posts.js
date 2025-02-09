import { Router } from "express";
import { redis, config, supabase, mongodb } from "../config/index.js";
import slugify from "slugify";

const router = Router();

// Get all posts
router.get("/", async (req, res, next) => {
  try {
    // Get posts from Supabase
    const { data: posts, error } = await supabase.from("posts").select(`
        *,
        author:users(id, username)
      `);

    if (error) throw new Error(error.message);

    // Get content from MongoDB
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

// Get single post (with caching)
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const key = `cache:post:${id}`;

    // Try to get from cache
    const cachedData = await redis.get(key);
    if (cachedData) {
      console.log(`Cache hit: ${key}`);
      return res.json(cachedData);
    }
    console.log(`Cache miss: ${key}`);

    // Get post from Supabase
    const { data: post, error } = await supabase
      .from("posts")
      .select(
        `
        *,
        author:users(id, username)
      `
      )
      .eq("id", id)
      .single();

    if (error) throw new Error("Post not found");

    // Get content from MongoDB
    const content = await mongodb.collection("posts").findOne({ _id: id });
    const fullPost = { ...post, content: content?.content };
    const obj = JSON.stringify(fullPost);
    console.log(obj);
    // Cache and send response
    await redis.set(key, JSON.stringify(fullPost), { ex: config.cacheExpiry });
    res.json(fullPost);
  } catch (error) {
    next(error);
  }
});

// Create post
router.post("/", async (req, res, next) => {
  try {
    const { title, content } = req.body;
    const userId = req.user.id;
    const slug = slugify(title, { lower: true });

    // Create post in Supabase
    const { data: post, error } = await supabase
      .from("posts")
      .insert({ title, author_id: userId, slug })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Store content in MongoDB
    await mongodb.collection("posts").insertOne({
      _id: post.id,
      content,
      version: 1,
      created_at: new Date(),
    });

    res.status(201).json(post);
  } catch (error) {
    next(error);
  }
});

// Update post
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, status } = req.body;
    const userId = req.user.id;

    // Update post in Supabase
    const updateData = {};
    if (title) {
      updateData.title = title;
      updateData.slug = slugify(title, { lower: true });
    }
    if (status) updateData.status = status;

    const { data: post, error } = await supabase
      .from("posts")
      .update(updateData)
      .eq("id", id)
      .eq("author_id", userId)
      .select()
      .single();

    if (error) throw new Error("Post not found");

    // Update content in MongoDB
    if (content) {
      const currentVersion = await mongodb
        .collection("posts")
        .findOne({ _id: id });
      await mongodb.collection("posts").updateOne(
        { _id: id },
        {
          $set: {
            content,
            version: (currentVersion?.version || 0) + 1,
          },
        }
      );
    }

    // Invalidate cache
    await redis.del(`cache:post:${id}`);
    res.json(post);
  } catch (error) {
    next(error);
  }
});

// Delete post
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", id)
      .eq("author_id", userId);

    if (error) throw new Error("Post not found");

    await mongodb.collection("posts").deleteOne({ _id: id });

    // Invalidate cache
    await redis.del(`cache:post:${id}`);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
