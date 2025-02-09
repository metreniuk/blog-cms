import { Router } from 'express';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validate';
import { cacheMiddleware } from '../middleware/cache';
import * as userController from '../controllers/users';

const router = Router();

router.get(
  '/:id',
  param('id').isUUID(),
  validate,
  cacheMiddleware,
  userController.getUser
);

router.get(
  '/:id/posts',
  param('id').isUUID(),
  validate,
  cacheMiddleware,
  userController.getUserPosts
);

router.put(
  '/:id',
  [
    param('id').isUUID(),
    body('username').optional().trim().notEmpty(),
    body('email').optional().isEmail(),
  ],
  validate,
  userController.updateUser
);

export default router;