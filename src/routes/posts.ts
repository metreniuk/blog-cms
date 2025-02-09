import { Router } from 'express';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validate';
import { cacheMiddleware } from '../middleware/cache';
import * as postController from '../controllers/posts';

const router = Router();

router.get('/', cacheMiddleware, postController.getPosts);

router.get(
  '/:id',
  param('id').isUUID(),
  validate,
  cacheMiddleware,
  postController.getPost
);

router.post(
  '/',
  [
    body('title').trim().notEmpty(),
    body('content').trim().notEmpty(),
    body('tags').isArray(),
  ],
  validate,
  postController.createPost
);

router.put(
  '/:id',
  [
    param('id').isUUID(),
    body('title').optional().trim().notEmpty(),
    body('content').optional().trim().notEmpty(),
    body('status').optional().isIn(['draft', 'published']),
    body('tags').optional().isArray(),
  ],
  validate,
  postController.updatePost
);

router.delete(
  '/:id',
  param('id').isUUID(),
  validate,
  postController.deletePost
);

export default router;