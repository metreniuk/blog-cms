import { supabase, mongodb, mongoClient } from "../src/config/index.js";

async function clearSupabase() {
  console.log("\nClearing Supabase data...");

  try {
    // Delete in correct order due to foreign key constraints
    const { error: postsError } = await supabase
      .from("posts")
      .delete()
      .neq("id", null);
    if (postsError) console.error("Error clearing posts:", postsError);
    else console.log("✓ Cleared posts table");

    const { error: usersError } = await supabase
      .from("users")
      .delete()
      .neq("id", null);
    if (usersError) console.error("Error clearing users:", usersError);
    else console.log("✓ Cleared users table");
  } catch (error) {
    console.error("Failed to clear Supabase:", error);
  }
}

async function clearMongoDB() {
  console.log("\nClearing MongoDB data...");

  try {
    await mongodb.collection("posts").deleteMany({});
    console.log("✓ Cleared posts collection");
  } catch (error) {
    console.error("Failed to clear MongoDB:", error);
  }
}

async function main() {
  try {
    await clearSupabase();
    await clearMongoDB();
    console.log("\nAll databases cleared successfully!");
  } catch (error) {
    console.error("Error during database clearing:", error);
  } finally {
    await mongoClient.close();
  }
}

main();
