const express = require('express');
const { supabase, mongodb } = require('../config');
const slugify = require('slugify');

const router = express.Router();

// Get all posts
router.get('/', async (req, res, next) => {
  try {
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:users(username),
        tags:post_tags(tag:tags(name))
      `);

    if (error) throw error;

    const postsWithContent = await Promise.all(
      posts.map(async (post) => {
        const content = await mongodb
          .collection('posts')
          .findOne({ _id: post.id });
        return { ...post, content: content?.content };
      })
    );

    res.json(postsWithContent);
  } catch (error) {
    next(error);
  }
});

// Get single post
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: post, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:users(username),
        tags:post_tags(tag:tags(name))
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    const content = await mongodb
      .collection('posts')
      .findOne({ _id: id });

    res.json({ ...post, content: content?.content });
  } catch (error) {
    next(error);
  }
});

// Create post
router.post('/', async (req, res, next) => {
  try {
    const { title, content, tags } = req.body;
    const userId = req.user.id; // From auth middleware

    const slug = slugify(title, { lower: true });

    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        title,
        author_id: userId,
        slug,
      })
      .select()
      .single();

    if (error) throw error;

    await mongodb.collection('posts').insertOne({
      _id: post.id,
      content,
      version: 1,
      created_at: new Date(),
    });

    if (tags?.length > 0) {
      await supabase
        .from('post_tags')
        .insert(
          tags.map(tagId => ({
            post_id: post.id,
            tag_id: tagId,
          }))
        );
    }

    res.status(201).json(post);
  } catch (error) {
    next(error);
  }
});

// Update post
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, status, tags } = req.body;
    const userId = req.user.id; // From auth middleware

    const updateData = {};
    if (title) {
      updateData.title = title;
      updateData.slug = slugify(title, { lower: true });
    }
    if (status) updateData.status = status;

    const { data: post, error } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', id)
      .eq('author_id', userId)
      .select()
      .single();

    if (error) throw error;

    if (content) {
      const currentPost = await mongodb
        .collection('posts')
        .findOne({ _id: id });

      await mongodb.collection('posts').updateOne(
        { _id: id },
        {
          $set: {
            content,
            version: (currentPost?.version || 0) + 1,
          },
        }
      );
    }

    if (tags) {
      await supabase
        .from('post_tags')
        .delete()
        .eq('post_id', id);

      if (tags.length > 0) {
        await supabase
          .from('post_tags')
          .insert(
            tags.map(tagId => ({
              post_id: id,
              tag_id: tagId,
            }))
          );
      }
    }

    res.json(post);
  } catch (error) {
    next(error);
  }
});

// Delete post
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id; // From auth middleware

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id)
      .eq('author_id', userId);

    if (error) throw error;

    await mongodb.collection('posts').deleteOne({ _id: id });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;