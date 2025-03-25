# KIPU Auth System

This document describes the KIPU Auth System, which is responsible for securely authenticating and signing requests to the KIPU API. The system is organized into four main modules: Configuration, Credentials, Server Utilities, and Signature Generation.

---

## 1. Configuration Module (config.ts / config.md)

**Purpose:**  
Provides configuration settings for KIPU API integration. It handles retrieving, caching, and validating KIPU credentials—using Supabase as the primary source and environment variables as a fallback.

**Key Functions:**

- **`parsePatientId(patientId: string)`**  
  Parses a composite patient ID (formatted as `"chartId:patientMasterId"`) into its components.  
  _Example Output:_ `{ chartId: '...', patientMasterId: '...' }`

- **`getKipuCredentialsAsync()`**  
  Retrieves KIPU API credentials asynchronously with caching (TTL: 5 minutes) to avoid repeated Supabase calls.

- **`getKipuCredentials()`**  
  Synchronously returns cached credentials or falls back to environment variables if not cached.

- **`validateKipuCredentials(credentials?: KipuCredentials)`**  
  Checks that all required credentials (`accessId`, `secretKey`, `appId`, `baseUrl`) are present.

- **`clearKipuCredentialsCache()`**  
  Clears the credentials cache, forcing a fresh fetch on the next request.

---

## 2. Credentials Module (credentials.ts / credentials.md)

**Purpose:**  
Manages the loading and storage of KIPU API credentials. It attempts to load credentials from Supabase and, if unavailable, falls back to environment variables.

**Key Functions:**

- **`loadKipuCredentialsFromSupabase()`**  
  Loads KIPU API credentials from the Supabase `user_api_settings` table for the authenticated user.  
  _Note:_ If no user is authenticated, it returns `null`.

- **`saveKipuCredentialsToSupabase(credentials: KipuCredentials)`**  
  Saves or updates the provided credentials in Supabase.

- **`getKipuCredentialsWithFallback()`**  
  Tries to load credentials from Supabase first, and if they are missing or incomplete, falls back to using environment variables.

---

## 3. Server Module (server.ts / server.md)

**Purpose:**  
Provides utilities for making authenticated API calls to the KIPU API. It wraps HTTP GET and POST operations with authentication, error handling, and response parsing.

**Key Functions:**

- **`buildKipuSignature(params: KipuSignatureParams)`**  
  Builds an HMAC SHA-1 signature based on the HTTP method, URL, date, and optional headers (content-type, content-MD5).  
  _Usage:_ Generates the canonical string for both GET and POST requests.

- **`kipuServerGet<T>(endpoint: string, customCredentials?: KipuCredentials)`**  
  Makes an authenticated GET request to the specified KIPU API endpoint.  
  - Ensures the `app_id` is included in the endpoint.
  - Generates authentication headers using the Signature module.
  - Validates the response and parses JSON.

- **`kipuServerPost<T>(endpoint: string, body: any, customCredentials?: KipuCredentials)`**  
  Makes an authenticated POST request.  
  - Converts the body to a JSON string.
  - Adds appropriate headers (including `Content-Type` and `Content-MD5`).
  - Uses the Signature module to generate the Authorization header.
  - Parses and validates the response.

---

## 4. Signature Module (signature.ts / signature.md)

**Purpose:**  
Handles generating the necessary signatures for authenticating with the KIPU API. The module follows the HMAC SHA-1 process to ensure each request is securely signed.

**Key Functions:**

- **`generateContentMD5(body: string)`**  
  Computes a Base64-encoded MD5 digest of the request body, used for POST requests.

- **`buildCanonicalString(method, contentType, contentMD5, requestUri, date)`**  
  Constructs a canonical string to be signed.  
  - For POST requests: `"<contentType>,<contentMD5>,<requestUri>,<date>"`
  - For GET requests: `",,<requestUri>,<date>"`

- **`generateSignature(canonicalString: string, secretKey: string)`**  
  Generates an HMAC SHA-1 signature using the canonical string and the provided secret key.

- **`formatAuthorizationHeader(accessId: string, signature: string)`**  
  Formats the Authorization header value (e.g., `APIAuth <accessId>:<signature>`).

- **`getCurrentRFC1123Date()`**  
  Returns the current date in RFC 1123 format (used in the Date header).

- **`generateKipuAuthHeaders(method, requestUri, credentials, body?, contentType)`**  
  Generates all required headers for an API request:
  - Sets `Accept`, `Date`, and (if POST) `Content-Type` and `Content-MD5`.
  - Ensures the `app_id` is included in GET requests.
  - Generates and attaches the `Authorization` header using the signature functions.

- **`createKipuRequestConfig(method, endpoint, credentials, body?)`**  
  Provides a complete fetch request configuration, combining method, headers, and body content for making a signed API call.

---

## Integration Overview

- **Credential Management:**  
  The system ensures credentials are fetched, cached, and validated before any API call is made.

- **Request Signing:**  
  Each request is signed using HMAC SHA-1, ensuring data integrity and secure authentication with the KIPU API.

- **Unified API Calls:**  
  The server module abstracts GET and POST operations, using configuration and signature utilities to seamlessly interact with the KIPU API.

This modular design allows other parts of the application (such as evaluation, facility, patient, and vitals services) to focus on business logic while relying on the KIPU Auth System for secure API communication.
