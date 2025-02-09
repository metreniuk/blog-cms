require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { MongoClient } = require('mongodb');

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// MongoDB client
const mongoClient = new MongoClient(process.env.MONGODB_URI);
const mongodb = mongoClient.db('blog-cms');

module.exports = {
  supabase,
  mongoClient,
  mongodb,
  config: {
    port: process.env.PORT || 3000
  }
};