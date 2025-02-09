const express = require('express');
const cors = require('cors');
const { config, supabase, mongodb } = require('./config');
const postsRouter = require('./routes/posts');
const usersRouter = require('./routes/users');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check Supabase connection
    const { data, error } = await supabase.from('users').select('id').limit(1);
    if (error) throw new Error('Supabase connection failed');

    // Check MongoDB connection
    await mongodb.command({ ping: 1 });

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        supabase: 'connected',
        mongodb: 'connected'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Routes
app.use('/api/posts', postsRouter);
app.use('/api/users', usersRouter);

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal server error'
  });
});

// Start server
app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});