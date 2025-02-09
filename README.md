# Project Setup Guide

This guide will help you set up the project locally on your machine.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Git
- A code editor (VS Code recommended)

## Database Setup Options

You can choose one of the following database providers:

### Option 1: Supabase

1. Create a free account at [Supabase](https://supabase.com)
2. Create a new project
3. Follow the [Supabase Quick Start Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nodejs)
4. Navigate to the SQL editor in your Supabase dashboard
5. Copy and execute the SQL commands from `sql/schema.sql`

### Option 2: MongoDB Atlas

1. Sign up for a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Create a new cluster by following the [MongoDB Atlas Setup Guide](https://www.mongodb.com/docs/atlas/getting-started/)
3. Get your connection string from the dashboard

### Option 3: Upstash

1. Create an account at [Upstash](https://upstash.com/)
2. Follow their [Getting Started Guide](https://docs.upstash.com/redis/overall/getstarted)
3. Create a new database and get your connection details

## Local Setup

1. Clone the repository:

```bash
git clone <repository-url>
cd <project-directory>
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory and add your environment variables:

```env
# Add the appropriate connection string based on your chosen database
DATABASE_URL=your_database_connection_string

# JWT secret for authentication
JWT_SECRET=your_jwt_secret

# Other environment variables as needed
API_KEY=your_api_key
PORT=3000
```

4. Seed the database (if needed):

```bash
npm run seed
```

5. Start the development server:

```bash
npm run dev
```

The server should now be running at `http://localhost:3000`

## API Endpoints

- `POST /api/users` - Create a new user
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get a specific user
- `PUT /api/users/:id` - Update a user
- `DELETE /api/users/:id` - Delete a user
- `GET /api/users/:id/posts` - Get all posts from a specific user
- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create a new post
- `GET /api/posts/:id` - Get a specific post
- `PUT /api/posts/:id` - Update a post
- `DELETE /api/posts/:id` - Delete a post

## Running Tests

```bash
npm test
```

## Development

- The project uses ESLint for code linting
- Jest is used as the testing framework
- API documentation can be found in the `/docs` directory

## Important Note

For security reasons, API keys and sensitive credentials are not included in this repository. Please contact your teacher/instructor to obtain the necessary API keys and credentials for local development and testing.

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [MongoDB Atlas Documentation](https://www.mongodb.com/docs/atlas/)
- [Upstash Documentation](https://docs.upstash.com/)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details

## API Usage Examples

Here are some examples of how to interact with the API using curl:

### User Operations

Create a new user:

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "email": "test@example.com"}'
```

Get all users:

```bash
curl http://localhost:3000/api/users
```

Get a specific user:

```bash
curl http://localhost:3000/api/users/USER_ID
```

Update a user:

```bash
curl -X PUT http://localhost:3000/api/users/USER_ID \
  -H "Content-Type: application/json" \
  -d '{"username": "updatedusername", "email": "updated@example.com"}'
```

Delete a user:

```bash
curl -X DELETE http://localhost:3000/api/users/USER_ID
```

Get all posts from a specific user:

```bash
curl http://localhost:3000/api/users/USER_ID/posts
```

### Posts Operations

Get all posts:

```bash
curl http://localhost:3000/api/posts
```

Create a new post:

```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{"title": "My First Post", "content": "This is the content of my post", "userId": "USER_ID"}'
```

Get a specific post:

```bash
curl http://localhost:3000/api/posts/POST_ID
```

Update a post:

```bash
curl -X PUT http://localhost:3000/api/posts/POST_ID \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Title", "content": "Updated content"}'
```

Delete a post:

```bash
curl -X DELETE http://localhost:3000/api/posts/POST_ID
```

Note: Replace `USER_ID` with the actual ID of the user and `POST_ID` with the actual ID of the post you want to interact with.
