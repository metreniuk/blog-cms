import { supabase, mongodb, mongoClient } from "../src/config/index.js";
import slugify from "slugify";

export const seedUsers = [
  {
    username: "john_doe",
    email: "john@example.com",
  },
  {
    username: "jane_smith",
    email: "jane@example.com",
  },
];

export const seedPosts = [
  {
    title: "Getting Started with Node.js",
    content: `
# Getting Started with Node.js

Node.js is a powerful runtime that lets you run JavaScript on the server. Here's how to get started:

## Installation
First, download Node.js from the official website...

## Your First Application
Let's create a simple HTTP server...

## Next Steps
Now that you have a basic understanding...
    `.trim(),
    status: "published",
  },
  {
    title: "Understanding MongoDB",
    content: `
# Understanding MongoDB

MongoDB is a popular NoSQL database. Let's explore its key concepts:

## Documents
In MongoDB, data is stored as documents...

## Collections
Documents are grouped into collections...

## Querying
MongoDB provides a rich query language...
    `.trim(),
    status: "published",
  },
  {
    title: "Draft: Advanced TypeScript",
    content: `
# Advanced TypeScript Concepts

This is a draft post about TypeScript's advanced features.

## Generics
TypeScript's generics provide a way to...

## Utility Types
TypeScript comes with several utility types...
    `.trim(),
    status: "draft",
  },
];

async function seedSupabase() {
  console.log("\nSeeding Supabase...");

  try {
    // Insert users
    const { data: users, error: usersError } = await supabase
      .from("users")
      .insert(seedUsers)
      .select();

    if (usersError) throw usersError;
    console.log(
      "✓ Created users:",
      users.map((u) => u.username)
    );

    // Insert posts
    const postsWithAuthors = seedPosts.map((post, index) => ({
      title: post.title,
      slug: slugify(post.title, { lower: true }),
      status: post.status,
      author_id: users[index % users.length].id,
    }));

    const { data: posts, error: postsError } = await supabase
      .from("posts")
      .insert(postsWithAuthors)
      .select();

    if (postsError) throw postsError;
    console.log(
      "✓ Created posts:",
      posts.map((p) => p.title)
    );

    return posts; // Return for MongoDB seeding
  } catch (error) {
    console.error("Failed to seed Supabase:", error);
    throw error;
  }
}

async function seedMongoDB(supabasePosts) {
  console.log("\nSeeding MongoDB...");

  try {
    const postsCollection = mongodb.collection("posts");

    // Prepare MongoDB documents
    const mongoDocuments = supabasePosts.map((post, index) => ({
      _id: post.id,
      content: seedPosts[index].content,
      version: 1,
      created_at: new Date(),
    }));

    await postsCollection.insertMany(mongoDocuments);
    console.log("✓ Created post contents in MongoDB");
  } catch (error) {
    console.error("Failed to seed MongoDB:", error);
    throw error;
  }
}

async function main() {
  try {
    const posts = await seedSupabase();
    await seedMongoDB(posts);
    console.log("\nSeeding completed successfully!");
  } catch (error) {
    console.error("Error during seeding:", error);
  } finally {
    await mongoClient.close();
  }
}

main();
