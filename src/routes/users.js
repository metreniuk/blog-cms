const express = require('express');
const { supabase } = require('../config');

const router = express.Router();

// Get user
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Get user posts
router.get('/:id/posts', async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        *,
        tags:post_tags(tag:tags(name))
      `)
      .eq('author_id', id);

    if (error) throw error;
    res.json(posts);
  } catch (error) {
    next(error);
  }
});

// Update user
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { username, email } = req.body;

    if (id !== req.user.id) {
      throw new Error('Forbidden');
    }

    const { data: user, error } = await supabase
      .from('users')
      .update({ username, email, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(user);
  } catch (error) {
    next(error);
  }
});

module.exports = router;