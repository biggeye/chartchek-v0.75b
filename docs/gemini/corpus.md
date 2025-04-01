# Corpora API Documentation

This document provides an overview of the Corpora API endpoints and related REST resources. It is designed to help language models understand and work with the API, including how to create, query, list, retrieve, update, and delete corpora, along with managing permissions and filtering metadata.

---

## Methods

### 1. `corpora.create`
Creates an empty Corpus.

- **Endpoint:**  
  `POST https://generativelanguage.googleapis.com/v1beta/corpora`

- **Request Body:**  
  Contains an instance of a Corpus with the following fields:
  
  - **name** (string, Immutable)  
    Identifier for the Corpus. The ID (name excluding the `"corpora/"` prefix) can contain up to 40 lowercase alphanumeric characters or dashes (`-`). The ID cannot start or end with a dash.  
    *If omitted on create, a unique name will be derived from `displayName` with a 12-character random suffix.*  
    **Example:**  
    `corpora/my-awesome-corpora-123a456b789c`
  
  - **displayName** (string, Optional)  
    A human-readable display name for the Corpus. Maximum length is 512 characters (including spaces).  
    **Example:** `"Docs on Semantic Retriever"`

- **Response Body:**  
  On success, returns the newly created instance of a Corpus.

---

### 2. `corpora.query`
Performs semantic search over a Corpus.

- **Endpoint:**  
  `POST https://generativelanguage.googleapis.com/v1beta/{name=corpora/*}:query`

- **Path Parameters:**
  - **name** (string, Required)  
    The name of the Corpus to query.  
    **Example:** `corpora/my-corpus-123`  
    *Format:* `corpora/{corpora}`

- **Request Body:**  
  Contains the following fields:
  
  - **query** (string, Required)  
    Query string to perform the semantic search.
  
  - **metadataFilters[]** (object, Optional)  
    Filter for Chunk and Document metadata. Each filter corresponds to a unique key; multiple filters are joined by logical **AND**s.
    
    **Example query (document level):**  
    `(year >= 2020 OR year < 2010) AND (genre = drama OR genre = action)`
    
    ```json
    [
      {
        "key": "document.custom_metadata.year",
        "conditions": [
          {"int_value": 2020, "operation": "GREATER_EQUAL"},
          {"int_value": 2010, "operation": "LESS"}
        ]
      },
      {
        "key": "document.custom_metadata.genre",
        "conditions": [
          {"stringValue": "drama", "operation": "EQUAL"},
          {"stringValue": "action", "operation": "EQUAL"}
        ]
      }
    ]
    ```
    
    **Example query (chunk level for numeric range):**  
    `(year > 2015 AND year <= 2020)`
    
    ```json
    [
      {
        "key": "chunk.custom_metadata.year",
        "conditions": [{"int_value": 2015, "operation": "GREATER"}]
      },
      {
        "key": "chunk.custom_metadata.year",
        "conditions": [{"int_value": 2020, "operation": "LESS_EQUAL"}]
      }
    ]
    ```
    
    *Note:* For the same key, numeric values support **AND** operations while string values support only **OR** operations.
  
  - **resultsCount** (integer, Optional)  
    The maximum number of Chunks to return. If unspecified, at most 10 Chunks are returned. The maximum allowed is 100.

- **Response Body:**  
  Returns a JSON object with a list of relevant chunks.  
  **Example:**
  
  ```json
  {
    "relevantChunks": [
      {
        // Object representing a RelevantChunk
      }
    ]
  }
