import { Router } from "express";
import { redis, config, supabase, mongodb } from "../config/index.js";
import slugify from "slugify";

const router = Router();

// Get all posts
router.get("/", async (req, res, next) => {
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
    const { data: posts, error } = await supabase.from("posts").select(`
      *,
      author:users(username),
      tags:post_tags(tag:tags(name))
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

    // Cache and send response
    await redis.set(key, JSON.stringify(postsWithContent), {
      ex: config.cacheExpiry,
    });
    res.json(postsWithContent);
  } catch (error) {
    next(error);
  }
});

// Get single post
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

    // Get post from Supabase
    const { id } = req.params;
    const { data: post, error } = await supabase
      .from("posts")
      .select(
        `
        *,
        author:users(username),
        tags:post_tags(tag:tags(name))
      `
      )
      .eq("id", id)
      .single();

    if (error) throw new Error("Post not found");

    // Get content from MongoDB
    const content = await mongodb.collection("posts").findOne({ _id: id });
    const fullPost = { ...post, content: content?.content };

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
    const { title, content, tags } = req.body;
    const userId = req.user.id; // From auth middleware
    const slug = slugify(title, { lower: true });

    // Create post in Supabase
    const { data: post, error } = await supabase
      .from("posts")
      .insert({
        title,
        author_id: userId,
        slug,
      })
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

    // Add tags
    if (tags?.length > 0) {
      await supabase.from("post_tags").insert(
        tags.map((tagId) => ({
          post_id: post.id,
          tag_id: tagId,
        }))
      );
    }

    // Clear cache for posts list
    const cachePattern = "cache:/api/posts*";
    const keys = await redis.keys(cachePattern);
    if (keys.length > 0) await redis.del(...keys);

    res.status(201).json(post);
  } catch (error) {
    next(error);
  }
});

// Update post
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, status, tags } = req.body;
    const userId = req.user.id; // From auth middleware

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

    // Update tags
    if (tags) {
      await supabase.from("post_tags").delete().eq("post_id", id);
      if (tags.length > 0) {
        await supabase.from("post_tags").insert(
          tags.map((tagId) => ({
            post_id: id,
            tag_id: tagId,
          }))
        );
      }
    }

    // Clear cache
    const cachePattern = "cache:/api/posts*";
    const keys = await redis.keys(cachePattern);
    if (keys.length > 0) await redis.del(...keys);

    res.json(post);
  } catch (error) {
    next(error);
  }
});

// Delete post
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id; // From auth middleware

    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", id)
      .eq("author_id", userId);

    if (error) throw new Error("Post not found");

    await mongodb.collection("posts").deleteOne({ _id: id });

    // Clear cache
    const cachePattern = "cache:/api/posts*";
    const keys = await redis.keys(cachePattern);
    if (keys.length > 0) await redis.del(...keys);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
