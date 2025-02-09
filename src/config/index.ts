import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { MongoClient } from 'mongodb';
import { Redis } from '@upstash/redis';

config();

// Supabase client
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// MongoDB client
export const mongoClient = new MongoClient(process.env.MONGODB_URI!);
export const mongodb = mongoClient.db('blog-cms');

// Redis client
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  rateLimitWindow: 15 * 60 * 1000, // 15 minutes
  rateLimitMax: 100, // requests per window
  cacheExpiry: 60 * 60, // 1 hour in seconds
};