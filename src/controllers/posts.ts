import { Request, Response, NextFunction } from 'express';
import slugify from 'slugify';
import { supabase } from '../config';
import { mongodb } from '../config';
import { clearCache } from '../middleware/cache';
import { AppError } from '../middleware/error';

export const getPosts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:users(username),
        tags:post_tags(tag:tags(name))
      `);

    if (error) throw new AppError(500, error.message);

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
};

export const getPost = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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

    if (error) throw new AppError(404, 'Post not found');

    const content = await mongodb
      .collection('posts')
      .findOne({ _id: id });

    res.json({ ...post, content: content?.content });
  } catch (error) {
    next(error);
  }
};

export const createPost = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { title, content, tags } = req.body;
    const userId = req.user.id; // From auth middleware

    const slug = slugify(title, { lower: true });

    // Create post metadata in PostgreSQL
    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        title,
        author_id: userId,
        slug,
      })
      .select()
      .single();

    if (error) throw new AppError(500, error.message);

    // Store content in MongoDB
    await mongodb.collection('posts').insertOne({
      _id: post.id,
      content,
      version: 1,
      created_at: new Date(),
    });

    // Add tags
    if (tags && tags.length > 0) {
      const { error: tagError } = await supabase
        .from('post_tags')
        .insert(
          tags.map((tagId: string) => ({
            post_id: post.id,
            tag_id: tagId,
          }))
        );

      if (tagError) throw new AppError(500, tagError.message);
    }

    await clearCache('cache:/api/posts*');
    res.status(201).json(post);
  } catch (error) {
    next(error);
  }
};

export const updatePost = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { title, content, status, tags } = req.body;
    const userId = req.user.id; // From auth middleware

    // Update post metadata in PostgreSQL
    const updateData: any = {};
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

    if (error) throw new AppError(404, 'Post not found');

    // Update content in MongoDB
    if (content) {
      const currentVersion = await mongodb
        .collection('posts')
        .findOne({ _id: id });

      await mongodb.collection('posts').updateOne(
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
      await supabase
        .from('post_tags')
        .delete()
        .eq('post_id', id);

      if (tags.length > 0) {
        await supabase
          .from('post_tags')
          .insert(
            tags.map((tagId: string) => ({
              post_id: id,
              tag_id: tagId,
            }))
          );
      }
    }

    await clearCache('cache:/api/posts*');
    res.json(post);
  } catch (error) {
    next(error);
  }
};

export const deletePost = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userId = req.user.id; // From auth middleware

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id)
      .eq('author_id', userId);

    if (error) throw new AppError(404, 'Post not found');

    await mongodb.collection('posts').deleteOne({ _id: id });
    await clearCache('cache:/api/posts*');

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};