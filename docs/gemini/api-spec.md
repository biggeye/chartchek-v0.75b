# Gemini API Endpoints Specification

## Overview
This specification defines the standard structure and behavior for all Gemini API endpoints in the ChartChek application.

## Route Structure
```
/api/gemini/{resource}/{action}/route.ts
```

## Authentication
All endpoints require authentication via `Supabase auth.getSession()`.

## Standard Route Template
```typescript
// app/api/gemini/{resource}/{action}/route.ts
import { NextResponse } from 'next/server';
import { geminiCorpusService } from '@/lib/gemini/corpus';
import { createServer } from '@/utils/supabase/server';

export async function POST(request: Request) {
  const supabase = await createServer();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const requestData = await request.json();
    // Validation and business logic here
    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error(`Error in ${resource}/${action}:`, error);
    return NextResponse.json(
      { error: error.message || `Failed to ${action} ${resource}` },
      { status: 500 }
    );
  }
}
```

## Endpoints

### 1. Create Corpus
- **Path:** `/api/gemini/corpus/create`
- **Method:** `POST`
- **Request Body:**
```json
{
  "displayName": "string (required)",
  "description": "string (optional)"
}
```
- **Supabase Operations:**
  - Table: `knowledge_corpus`
  - Operation: `insert`
  - Fields:
    - `corpus_name`: corpus.name
    - `display_name`: requestBody.displayName
    - `description`: requestBody.description || null
    - `created_by`: session.user.id
- **Response:** Supabase response data

### 2. Query Corpus
- **Path:** `/api/gemini/corpus/query`
- **Method:** `POST`
- **Request Body:**
```json
{
  "corpusName": "string (required)",
  "query": "string (required)",
  "metadataFilters": "MetadataFilter[] (optional)",
  "resultsCount": "number (optional, default: 10)"
}
```
- **Response:** Gemini API response

### 3. Create Document
- **Path:** `/api/gemini/document/create`
- **Method:** `POST`
- **Request Body:**
```json
{
  "corpusName": "string (required)",
  "document": {
    "displayName": "string (required)",
    "content": "string (required)",
    "mimeType": "string (optional, default: text/plain)",
    "metadata": "object (optional)"
  }
}
```
- **Supabase Operations:**
  - Table: `knowledge_documents`
  - Operation: `insert`
  - Fields:
    - `corpus_name`: requestBody.corpusName
    - `document_name`: response.name
    - `display_name`: requestBody.document.displayName
    - `created_by`: session.user.id
- **Response:** Supabase response data

### 4. Delete Document
- **Path:** `/api/gemini/document/delete`
- **Method:** `DELETE`
- **Request Body:**
```json
{
  "documentName": "string (required)"
}
```
- **Supabase Operations:**
  - Table: `knowledge_documents`
  - Operation: `delete`
  - Where: `document_name = requestBody.documentName`
- **Response:** Success message

### 5. List Corpora
- **Path:** `/api/gemini/corpus/list`
- **Method:** `GET`
- **Response:** Array of corpus objects

### 6. List Documents
- **Path:** `/api/gemini/document/list`
- **Method:** `GET`
- **Query Parameters:**
  - `corpusName`: string (required)
- **Response:** Array of document objects

## Error Handling
All endpoints should follow this error response format:
```json
{
  "error": "Error message"
}
```

## Example Implementation: Query Corpus Endpoint
```typescript
// app/api/gemini/corpus/query/route.ts
import { NextResponse } from 'next/server';
import { geminiCorpusService} from '@/lib/gemini/corpus';
import { createServer } from '@/utils/supabase/server';

export async function POST(request: Request) {
  const supabase = await createServer();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { corpusName, query, metadataFilters, resultsCount = 10 } = await request.json();

    if (!corpusName || !query) {
      return NextResponse.json(
        { error: 'corpusName and query are required' },
        { status: 400 }
      );
    }

    const results = await geminiCorpusService.queryCorpus(
      corpusName,
      query,
      metadataFilters as MetadataFilter[],
      resultsCount
    );

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Error querying corpus:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to query corpus' },
      { status: 500 }
    );
  }
}
```

