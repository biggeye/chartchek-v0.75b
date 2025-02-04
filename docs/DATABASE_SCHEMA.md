# ChartChek Database Schema Documentation

This documentation outlines the Supabase database schema for the ChartChek application, detailing the structure and relationships between tables.

## Chat System Tables

### chat_threads
Primary table for managing chat conversations.

```sql
CREATE TABLE chat_threads (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    thread_id TEXT NOT NULL,
    assistant_id TEXT,
    status chat_thread_status,  -- ENUM type
    metadata JSONB[],
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_chat_threads_user ON chat_threads(user_id);
CREATE INDEX idx_chat_threads_thread ON chat_threads(thread_id);
```

### chat_messages
Stores individual messages within chat threads.

```sql
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY,
    thread_id TEXT REFERENCES chat_threads(thread_id),
    message_id TEXT,
    user_id TEXT,
    role message_role NOT NULL,  -- ENUM: 'user', 'assistant'
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_messages_thread ON chat_messages(thread_id);
CREATE INDEX idx_chat_messages_user ON chat_messages(user_id);
```

### chat_message_annotations
Stores annotations and metadata for messages.

```sql
CREATE TABLE chat_message_annotations (
    id UUID PRIMARY KEY,
    message_id UUID REFERENCES chat_messages(id),
    type TEXT NOT NULL,
    text TEXT NOT NULL,
    file_id TEXT,
    quote TEXT,
    start_index INTEGER,
    end_index INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_chat_annotations_message ON chat_message_annotations(message_id);
```

### chat_files
Manages files associated with chat conversations.

```sql
CREATE TABLE chat_files (
    id UUID PRIMARY KEY,
    thread_id UUID NOT NULL,
    file_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    purpose TEXT NOT NULL,
    bytes INTEGER,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_chat_files_thread ON chat_files(thread_id);
```

## Document Management Tables

### documents
Primary table for document storage and management.

```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    file_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    file_type TEXT,
    facility TEXT,
    category TEXT,
    size_bytes BIGINT,
    vector_store_id TEXT,
    processing_status document_status,  -- ENUM type
    storage_path TEXT,
    mime_type TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_documents_user ON documents(user_id);
CREATE INDEX idx_documents_vector_store ON documents(vector_store_id);
```

### vector_stores
Manages OpenAI vector stores for document embeddings.

```sql
CREATE TABLE vector_stores (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    openai_vector_store_id TEXT NOT NULL,
    name TEXT NOT NULL,
    status vector_store_status NOT NULL,  -- ENUM type
    expires_at TIMESTAMPTZ,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_vector_stores_user ON vector_stores(user_id);
```

### document_vector_stores
Junction table linking documents to vector stores.

```sql
CREATE TABLE document_vector_stores (
    id UUID PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES documents(id),
    vector_store_id UUID NOT NULL REFERENCES vector_stores(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_doc_vector_stores_doc ON document_vector_stores(document_id);
CREATE INDEX idx_doc_vector_stores_store ON document_vector_stores(vector_store_id);
```

## User Management Tables

### user_assistants
Manages user-specific OpenAI assistants.

```sql
CREATE TABLE user_assistants (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    assistant_id TEXT NOT NULL,
    name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_assistants_user ON user_assistants(user_id);
```

### resources
Stores static resources and content.

```sql
CREATE TABLE resources (
    id VARCHAR PRIMARY KEY,
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);
```

## Custom Types

```sql
-- Enum Types
CREATE TYPE message_role AS ENUM ('user', 'assistant');
CREATE TYPE chat_thread_status AS ENUM ('active', 'archived', 'deleted');
CREATE TYPE document_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE vector_store_status AS ENUM ('active', 'expired', 'deleted');
```

## Key Relationships

1. **Chat System**
   ```
   chat_threads
   ├── chat_messages (thread_id)
   │   └── chat_message_annotations (message_id)
   └── chat_files (thread_id)
   ```

2. **Document System**
   ```
   documents
   ├── vector_stores (via document_vector_stores)
   └── user_id (auth.users)
   ```

3. **User System**
   ```
   auth.users
   ├── chat_threads
   ├── documents
   ├── vector_stores
   └── user_assistants
   ```

## Security Policies

All tables implement Row Level Security (RLS) policies:
- Users can only access their own data
- Authentication required for all operations
- System-level operations restricted to admin roles

## Indexes

Strategic indexes are created on:
- Foreign key relationships
- Frequently queried columns
- Timestamp columns for sorting
- UUID and TEXT identifiers

## Timestamps

Most tables include:
- `created_at`: Creation timestamp
- `updated_at`: Last modification timestamp

These are automatically managed through triggers.
