# ChartChek API Documentation

This documentation outlines the API endpoints for the ChartChek application, which uses NextJS 15 with the App Router configuration, OpenAI Assistants API v2 beta, and Supabase for authentication and PostgreSQL database.

## Authentication

All endpoints require authentication using Supabase Auth. The user must be logged in, and the API will return a 401 Unauthorized response if authentication fails.

## Base URL

```
/api
```

## Endpoints

### Assistants

#### Create Assistant
- **POST** `/api/assistant/create`
- Creates a new OpenAI Assistant
- **Request Body**: FormData
  ```typescript
  {
    name: string;
    instructions: string;
    model: string;
    tools?: Tool[];
    fileIds?: string[];
  }
  ```
- **Response**: Assistant object

#### Update Assistant
- **POST** `/api/assistant/update`
- Updates an existing OpenAI Assistant
- **Request Body**: JSON
  ```typescript
  {
    assistant_id: string;
    updates: {
      name?: string;
      instructions?: string;
      tools?: Tool[];
      fileIds?: string[];
    }
  }
  ```
- **Response**: Updated Assistant object

### Threads

#### Create Thread
- **POST** `/api/thread/create`
- Creates a new thread with optional initial message
- **Request Body**: FormData
  ```typescript
  {
    message?: string;
  }
  ```
- **Response**: Thread object with thread_id

#### List Threads
- **GET** `/api/thread`
- Retrieves all threads for the authenticated user
- **Response**: Array of Thread objects
  ```typescript
  {
    success: boolean;
    data: Thread[];
  }
  ```

#### Create Message
- **POST** `/api/thread/message`
- Adds a new message to a thread
- **Request Body**: JSON
  ```typescript
  {
    thread_id: string;
    message: string;
  }
  ```
- **Response**: Message object

#### Add Message Attachment
- **POST** `/api/thread/message/attachment`
- Adds an attachment to a thread message
- **Request Body**: JSON
  ```typescript
  {
    thread_id: string;
    message: string;
    file_ids: string[];
  }
  ```
- **Response**: Message object with attachments

#### Stream Run
- **POST** `/api/thread/run/stream`
- Initiates and streams a thread run with the Assistant
- **Request Body**: JSON
  ```typescript
  {
    thread_id: string;
    assistant_id: string;
  }
  ```
- **Response**: Server-Sent Events (SSE) stream
- **Events**:
  - `thread.message.created`
  - `thread.message.in_progress`
  - `thread.message.delta`
  - `thread.message.completed`
  - `thread.run.created`
  - `thread.run.completed`
  - `error`
  - `done`

### Files

#### Upload File
- **POST** `/api/file/upload`
- Uploads a file to OpenAI and stores reference in Supabase
- **Request Body**: FormData
  ```typescript
  {
    file: File;
  }
  ```
- **Response**: 
  ```typescript
  {
    success: boolean;
    file_id: string;
    filename: string;
  }
  ```

## Database Schema (Supabase)

### UserThread Table
```sql
CREATE TABLE user_threads (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  thread_id TEXT NOT NULL,
  assistant_id TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);
```

### UserFile Table
```sql
CREATE TABLE user_files (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  file_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  purpose TEXT CHECK (purpose IN ('assistants', 'messages')),
  bytes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Error Handling

All endpoints follow a consistent error response format:

```typescript
{
  success: false,
  error: string
}
```

Common HTTP status codes:
- 200: Success
- 400: Bad Request (missing or invalid parameters)
- 401: Unauthorized (authentication required)
- 500: Internal Server Error

## Rate Limiting

Rate limiting is handled by the OpenAI API's built-in limits. Refer to OpenAI's documentation for current rate limits.

## Streaming Support

The application supports streaming responses from the OpenAI Assistants API through Server-Sent Events (SSE). The streaming endpoint `/api/thread/run/stream` provides real-time updates of assistant responses and run status changes.

## Security Notes

1. All endpoints require authentication
2. API keys are stored securely in environment variables
3. File uploads are validated for size and type
4. User data is isolated by user_id
5. Supabase RLS (Row Level Security) policies are in place
