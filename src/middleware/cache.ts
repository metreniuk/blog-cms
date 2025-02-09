import { Request, Response, NextFunction } from 'express';
import { redis } from '../config';
import { config } from '../config';

export const cacheMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.method !== 'GET') return next();

  const key = `cache:${req.originalUrl}`;
  const cachedData = await redis.get(key);

  if (cachedData) {
    return res.json(JSON.parse(cachedData));
  }

  const originalJson = res.json;
  res.json = function (data) {
    redis.set(key, JSON.stringify(data), {
      ex: config.cacheExpiry
    });
    return originalJson.call(this, data);
  };

  next();
};

export const clearCache = async (pattern: string) => {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
};