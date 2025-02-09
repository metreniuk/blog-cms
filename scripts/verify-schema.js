import { supabase, mongodb, mongoClient } from "../src/config/index.js";

async function verifySupabaseSchema() {
  console.log("\nVerifying Supabase Schema...");

  // Check posts table
  const { data: postsInfo, error: postsError } = await supabase
    .from("posts")
    .select("*")
    .limit(1);

  if (postsError) {
    console.error("❌ Posts table error:", postsError.message);
  } else {
    const postColumns = Object.keys(postsInfo[0] || {});
    console.log("✓ Posts table exists with columns:", postColumns);

    // Expected columns
    const expectedPostColumns = [
      "id",
      "title",
      "slug",
      "status",
      "author_id",
      "created_at",
      "updated_at",
    ];

    const missingColumns = expectedPostColumns.filter(
      (col) => !postColumns.includes(col)
    );
    if (missingColumns.length > 0) {
      console.error("❌ Missing columns in posts table:", missingColumns);
    }
  }

  // Check users table
  const { data: usersInfo, error: usersError } = await supabase
    .from("users")
    .select("*")
    .limit(1);

  if (usersError) {
    console.error("❌ Users table error:", usersError.message);
  } else {
    const userColumns = Object.keys(usersInfo[0] || {});
    console.log("✓ Users table exists with columns:", userColumns);

    // Expected columns
    const expectedUserColumns = [
      "id",
      "username",
      "email",
      "created_at",
      "updated_at",
    ];

    const missingColumns = expectedUserColumns.filter(
      (col) => !userColumns.includes(col)
    );
    if (missingColumns.length > 0) {
      console.error("❌ Missing columns in users table:", missingColumns);
    }
  }

  // Verify foreign key relationship
  const { data: fkCheck, error: fkError } = await supabase
    .from("posts")
    .select(
      `
      *,
      author:users(*)
    `
    )
    .limit(1);

  if (fkError) {
    console.error("❌ Foreign key relationship error:", fkError.message);
  } else {
    console.log("✓ Foreign key relationship between posts and users is valid");
  }
}

async function verifyMongoDBSchema() {
  console.log("\nVerifying MongoDB Schema...");

  try {
    // Check posts collection
    const postsCollection = mongodb.collection("posts");
    const samplePost = await postsCollection.findOne();

    if (!samplePost) {
      console.log("ℹ️ Posts collection is empty");
    } else {
      console.log(
        "✓ Posts collection exists with fields:",
        Object.keys(samplePost)
      );

      // Expected fields
      const expectedFields = ["_id", "content", "version", "created_at"];
      const missingFields = expectedFields.filter(
        (field) => !Object.keys(samplePost).includes(field)
      );

      if (missingFields.length > 0) {
        console.error("❌ Missing fields in posts collection:", missingFields);
      }
    }

    // Verify indexes
    const indexes = await postsCollection.indexes();
    console.log(
      "✓ Posts collection indexes:",
      indexes.map((idx) => idx.name)
    );
  } catch (error) {
    console.error("❌ MongoDB verification error:", error);
  }
}

async function verifyDataConsistency() {
  console.log("\nVerifying Data Consistency...");

  try {
    // Check if all Supabase posts have corresponding MongoDB documents
    const { data: posts, error } = await supabase
      .from("posts")
      .select("id")
      .limit(10);

    if (error) throw error;

    for (const post of posts) {
      const mongoPost = await mongodb
        .collection("posts")
        .findOne({ _id: post.id });
      if (!mongoPost) {
        console.error(`❌ Missing MongoDB document for post ${post.id}`);
      }
    }

    console.log("✓ Checked data consistency for", posts.length, "posts");
  } catch (error) {
    console.error("❌ Data consistency verification error:", error);
  }
}

async function main() {
  try {
    console.log("Starting Schema Verification...");

    await verifySupabaseSchema();
    await verifyMongoDBSchema();
    await verifyDataConsistency();

    console.log("\nVerification Complete!");
  } catch (error) {
    console.error("Verification failed:", error);
  } finally {
    await mongoClient.close();
  }
}

main();
