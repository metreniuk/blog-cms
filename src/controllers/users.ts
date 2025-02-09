import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config';
import { AppError } from '../middleware/error';

export const getUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new AppError(404, 'User not found');

    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const getUserPosts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        *,
        tags:post_tags(tag:tags(name))
      `)
      .eq('author_id', id);

    if (error) throw new AppError(500, error.message);

    res.json(posts);
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { username, email } = req.body;

    // Ensure user can only update their own profile
    if (id !== req.user.id) {
      throw new AppError(403, 'Forbidden');
    }

    const { data: user, error } = await supabase
      .from('users')
      .update({ username, email, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new AppError(404, 'User not found');

    res.json(user);
  } catch (error) {
    next(error);
  }
};