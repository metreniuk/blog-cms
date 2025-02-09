import express from "express";
import cors from "cors";
import { config, supabase, mongodb } from "./config/index.js";
import postsRouter from "./routes/posts.js";
import usersRouter from "./routes/users.js";

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());

// Simple request logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    // Check Supabase connection
    const { error: supabaseError } = await supabase
      .from("users")
      .select("id")
      .limit(1);
    if (supabaseError) throw new Error("Supabase connection failed");

    // Check MongoDB connection
    await mongodb.command({ ping: 1 });

    res.json({
      status: "healthy",
      services: {
        supabase: "connected",
        mongodb: "connected",
      },
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      error: error.message,
    });
  }
});

// Routes
app.use("/api/posts", postsRouter);
app.use("/api/users", usersRouter);

// Simple error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.statusCode || 500).json({
    error: err.message || "Something went wrong",
  });
});

// Start server
app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
