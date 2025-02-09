import { mongodb, mongoClient } from "../src/config/index.js";

async function initializeMongoDB() {
  try {
    console.log("Initializing MongoDB...");

    // Initialize posts collection
    const postsCollection = mongodb.collection("posts");

    // Create indexes
    console.log("Creating indexes...");
    await postsCollection.createIndexes([
      { key: { _id: 1 }, name: "primary_id" },
      { key: { created_at: 1 }, name: "created_at" },
      { key: { version: 1 }, name: "version" },
    ]);

    // Validate collection
    const validator = {
      $jsonSchema: {
        bsonType: "object",
        required: ["_id", "content", "version", "created_at"],
        properties: {
          _id: {
            bsonType: "string",
            description: "UUID of the post, must match Supabase post id",
          },
          content: {
            bsonType: "string",
            description: "Content of the post",
          },
          version: {
            bsonType: "int",
            minimum: 1,
            description: "Version number of the content",
          },
          created_at: {
            bsonType: "date",
            description: "Creation timestamp",
          },
        },
      },
    };

    // Apply schema validation
    await mongodb
      .command({
        collMod: "posts",
        validator: validator,
        validationLevel: "moderate",
      })
      .catch(async (err) => {
        if (err.code === 26) {
          // Collection doesn't exist, create it
          await mongodb.createCollection("posts", {
            validator: validator,
          });
        } else {
          throw err;
        }
      });

    console.log("✓ MongoDB initialization complete!");
  } catch (error) {
    console.error("Failed to initialize MongoDB:", error);
  } finally {
    await mongoClient.close();
  }
}

initializeMongoDB();
