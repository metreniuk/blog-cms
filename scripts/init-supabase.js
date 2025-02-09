import { supabase } from "../src/config/index.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function initializeSupabase() {
  try {
    console.log("Reading schema.sql...");
    const schemaPath = path.join(__dirname, "..", "sql", "schema.sql");
    const schema = await fs.readFile(schemaPath, "utf-8");

    // Split the schema into individual statements
    const statements = schema
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    console.log(`Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (const statement of statements) {
      const { error } = await supabase.rpc("exec_sql", { sql: statement });
      if (error) {
        console.error("Error executing statement:", error);
        console.error("Statement:", statement);
      } else {
        console.log("✓ Successfully executed statement");
      }
    }

    console.log("Schema initialization complete!");
  } catch (error) {
    console.error("Failed to initialize schema:", error);
  }
}

initializeSupabase();
