```markdown
# Create a Model Response

## Endpoint

**POST** `https://api.openai.com/v1/responses`

Generates a model response. Inputs can include text, images, or files to produce text or JSON outputs. The model can call custom code or built-in tools such as web or file search.

---

## Request Body

### `input` *(string or array, required)*
Inputs to generate a response. Can include:
- Text
- Images
- Files

### Types of Inputs

#### Text Input *(string)*
- Simple text input equivalent to user input.

#### Input Item List *(array)*
- A collection of multiple input items containing different content types.

### Input Message *(object)*
A message with roles defining instruction priority. System or developer roles override user instructions.

#### Properties
- `content` *(string or array, required)*: Text, image, or audio input, including previous assistant responses.
- `role` *(string, required)*: User, assistant, system, or developer.
- `type` *(string, optional)*: Always `message`.

### Input Item Types

#### Text Input *(object)*
- `text` *(string, required)*: The input text.
- `type` *(string, required)*: Always `input_text`.

#### Image Input *(object)*
- `detail` *(string, required)*: `high`, `low`, or `auto` (default: `auto`).
- `type` *(string, required)*: Always `input_image`.
- `file_id` *(string or null, optional)*
- `image_url` *(string or null, optional)*: URL or base64-encoded image.

#### File Input *(object)*
- `type` *(string, required)*: Always `input_file`.
- `file_data` *(string, optional)*
- `file_id` *(string, optional)*
- `filename` *(string, optional)*

---

## Output Types

### Output Message *(object)*
- `id` *(string, required)*: Unique ID.
- `content` *(array, required)*
- `role` *(string, required)*: Always `assistant`.
- `status` *(string, required)*: `in_progress`, `completed`, or `incomplete`.
- `type` *(string, required)*: Always `message`.

---

## Tool Calls

### File Search Tool Call *(object)*
- Searches files. Status: `in_progress`, `searching`, `incomplete`, or `failed`.

### Computer Tool Call *(object)*
- Calls a computer tool.

### Web Search Tool Call *(object)*
- Conducts web searches.

### Function Tool Call *(object)*
- Calls a custom-defined function.

---

## Additional Parameters
- `model` *(string, required)*: Model ID (e.g., `gpt-4o`).
- `include` *(array or null, optional)*: Additional data like search results or image URLs.
- `instructions` *(string or null, optional)*: System/developer message context.
- `max_output_tokens` *(integer or null, optional)*: Token limit for response.
- `metadata` *(map, optional)*: Key-value pairs for structured data storage.
- `parallel_tool_calls` *(boolean, optional)*: Default `true`. Allows parallel tool execution.
- `previous_response_id` *(string or null, optional)*: Enables multi-turn conversations.
- `reasoning` *(object or null, optional)*: For reasoning models.
- `store` *(boolean, optional)*: Default `true`. Store response for later retrieval.
- `stream` *(boolean, optional)*: Default `false`. Enables streaming responses.
- `temperature` *(number, optional)*: Default `1`. Controls randomness.
- `tool_choice` *(string or object, optional)*: Specifies tool usage.
- `tools` *(array, optional)*: Built-in and custom tools.
- `top_p` *(number, optional)*: Default `1`. Alternative to temperature for sampling.
- `truncation` *(string, optional)*: Default `disabled`. Controls truncation strategy.
- `user` *(string, optional)*: Unique identifier for end-user.

---

## Response

Returns a **Response** object.
```

