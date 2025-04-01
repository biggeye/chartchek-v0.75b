
# Corpora Documents API Documentation

This document provides an overview of the Corpora Documents API endpoints and related REST resources. It is designed to help language models and developers understand and work with the API, including how to create, query, list, retrieve, update, and delete documents, along with details about document metadata.

---

## Methods

### 1. `corpora.documents.create`
Creates an empty Document.

- **Endpoint:**  
  `POST https://generativelanguage.googleapis.com/v1beta/{parent=corpora/*}/documents`

- **Path Parameters:**
  - **parent** (string, Required)  
    The name of the Corpus where this Document will be created.  
    **Example:** `corpora/my-corpus-123`  
    *Format:* `corpora/{corpora}`

- **Request Body:**  
  Contains an instance of a Document with the following fields:
  
  - **name** (string, Immutable)  
    Identifier for the Document. The ID (name excluding the `"corpora/*/documents/"` prefix) can contain up to 40 lowercase alphanumeric characters or dashes (`-`). The ID cannot start or end with a dash.  
    *If omitted on create, a unique name will be derived from `displayName` along with a 12-character random suffix.*  
    **Example:**  
    `corpora/{corpus_id}/documents/my-awesome-doc-123a456b789c`
  
  - **displayName** (string, Optional)  
    The human-readable display name for the Document. Maximum length is 512 characters (including spaces).  
    **Example:** `"Semantic Retriever Documentation"`
  
  - **customMetadata[]** (object, Optional)  
    User-provided custom metadata stored as key-value pairs for querying. A Document can have a maximum of 20 CustomMetadata entries.

- **Response Body:**  
  On success, returns the newly created instance of a Document.

---

### 2. `corpora.documents.query`
Performs semantic search over a Document.

- **Endpoint:**  
  `POST https://generativelanguage.googleapis.com/v1beta/{name=corpora/*/documents/*}:query`

- **Path Parameters:**
  - **name** (string, Required)  
    The name of the Document to query.  
    **Example:** `corpora/my-corpus-123/documents/the-doc-abc`  
    *Format:* `corpora/{corpora}/documents/{document}`

- **Request Body:**  
  Contains the following fields:
  
  - **query** (string, Required)  
    Query string to perform semantic search.
  
  - **resultsCount** (integer, Optional)  
    The maximum number of Chunks to return. If unspecified, at most 10 Chunks are returned. The maximum allowed is 100.
  
  - **metadataFilters[]** (object, Optional)  
    Filter for Chunk metadata. Each `MetadataFilter` object corresponds to a unique key; multiple filters are joined by logical **AND**s.  

    **Example Query (with filters):**  
    `(year >= 2020 OR year < 2010) AND (genre = drama OR genre = action)`  
    **MetadataFilter Object List Example:**  
    ```json
    [
      {
        "key": "chunk.custom_metadata.year",
        "conditions": [
          {"int_value": 2020, "operation": "GREATER_EQUAL"},
          {"int_value": 2010, "operation": "LESS"}
        ]
      },
      {
        "key": "chunk.custom_metadata.genre",
        "conditions": [
          {"stringValue": "drama", "operation": "EQUAL"},
          {"stringValue": "action", "operation": "EQUAL"}
        ]
      }
    ]
    ```
    
- **Response Body:**  
  Returns a JSON object containing a list of relevant chunks.  

### [Additional methods and resource descriptions have been truncated due to space limits. Original document provided by user should be referenced for full details.]

