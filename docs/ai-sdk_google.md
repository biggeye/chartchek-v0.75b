```md
# Google Generative AI Provider

The Google Generative AI provider contains language and embedding model support for the Google Generative AI APIs.

## Setup

The Google provider is available in the `@ai-sdk/google` module. You can install it with:

```bash
pnpm add @ai-sdk/google
# or
npm install @ai-sdk/google
# or
yarn add @ai-sdk/google
```

## Provider Instance

You can import the default provider instance `google` from `@ai-sdk/google`:

```ts
import { google } from '@ai-sdk/google';
```

If you need a customized setup:

```ts
import { createGoogleGenerativeAI } from '@ai-sdk/google';

const google = createGoogleGenerativeAI({
  // custom settings
});
```

### Optional Settings

- **baseURL**: Custom API base URL.
- **apiKey**: API key via `x-goog-api-key` or env var `GOOGLE_GENERATIVE_AI_API_KEY`.
- **headers**: Custom request headers.
- **fetch**: Custom `fetch` implementation.

---

## Language Models

```ts
const model = google('gemini-1.5-pro-latest');
```

For fine-tuned models:

```ts
google('tunedModels/my-model');
```

With model-specific options:

```ts
const model = google('gemini-1.5-pro-latest', {
  safetySettings: [
    { category: 'HARM_CATEGORY_UNSPECIFIED', threshold: 'BLOCK_LOW_AND_ABOVE' },
  ],
});
```

### Google Model Settings

- **cachedContent**
- **structuredOutputs** (default `true`)
- **safetySettings**: array of `{ category, threshold }`

---

## Text Generation

```ts
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

const { text } = await generateText({
  model: google('gemini-1.5-pro-latest'),
  prompt: 'Write a vegetarian lasagna recipe for 4 people.',
});
```

Also supported:
- `streamText`
- `generateObject`
- `streamObject`

---

## File Inputs

```ts
const result = await generateText({
  model: google('gemini-1.5-flash'),
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'What is an embedding model according to this document?' },
        { type: 'file', data: fs.readFileSync('./data/ai.pdf'), mimeType: 'application/pdf' },
      ],
    },
  ],
});
```

---

## Cached Content

```ts
import { GoogleAICacheManager } from '@google/generative-ai/server';

const cacheManager = new GoogleAICacheManager(process.env.GOOGLE_GENERATIVE_AI_API_KEY);

const model = 'models/gemini-1.5-pro-001';

const { name: cachedContent } = await cacheManager.create({
  model,
  contents: [{ role: 'user', parts: [{ text: '1000 Lasagna Recipes...' }] }],
  ttlSeconds: 300,
});

const { text: veggieLasangaRecipe } = await generateText({
  model: google(model, { cachedContent }),
  prompt: 'Write a vegetarian lasagna recipe for 4 people.',
});
```

---

## Search Grounding

```ts
const { text, providerMetadata } = await generateText({
  model: google('gemini-1.5-pro', { useSearchGrounding: true }),
  prompt: 'List the top 5 San Francisco news from the past week.',
});

const metadata = providerMetadata?.google;
const groundingMetadata = metadata?.groundingMetadata;
```

Grounding metadata fields:
- `webSearchQueries`
- `searchEntryPoint`
- `groundingSupports`

---

## Dynamic Retrieval

```ts
const { text } = await generateText({
  model: google('gemini-1.5-flash', {
    useSearchGrounding: true,
    dynamicRetrievalConfig: {
      mode: 'MODE_DYNAMIC',
      dynamicThreshold: 0.8,
    },
  }),
  prompt: 'Who won the latest F1 grand prix?',
});
```

Modes:
- `MODE_DYNAMIC`
- `MODE_UNSPECIFIED`

---

## Sources

```ts
const { sources } = await generateText({
  model: google('gemini-2.0-flash-exp', { useSearchGrounding: true }),
  prompt: 'List the top 5 San Francisco news from the past week.',
});
```

---

## Image Outputs

```ts
const result = await generateText({
  model: google('gemini-2.0-flash-exp'),
  providerOptions: {
    google: { responseModalities: ['TEXT', 'IMAGE'] },
  },
  prompt: 'Generate an image of a comic cat',
});

for (const file of result.files) {
  if (file.mimeType.startsWith('image/')) {
    // show the image
  }
}
```

---

## Safety Ratings

```json
{
  "safetyRatings": [
    {
      "category": "HARM_CATEGORY_HATE_SPEECH",
      "probability": "NEGLIGIBLE",
      "probabilityScore": 0.11,
      "severity": "HARM_SEVERITY_LOW",
      "severityScore": 0.28
    }
    // ...
  ]
}
```

---

## Troubleshooting: Schema Limitations

Workaround for unsupported schema unions:

```ts
const result = await generateObject({
  model: google('gemini-1.5-pro-latest', { structuredOutputs: false }),
  schema: z.object({
    name: z.string(),
    age: z.number(),
    contact: z.union([
      z.object({ type: z.literal('email'), value: z.string() }),
      z.object({ type: z.literal('phone'), value: z.string() }),
    ]),
  }),
  prompt: 'Generate an example person for testing.',
});
```

Unsupported Zod features:
- `z.union`
- `z.record`

---

## Model Capabilities

| Model                         | Image Input | Object Generation | Tool Usage | Tool Streaming |
|------------------------------|-------------|--------------------|-------------|----------------|
| gemini-2.5-pro-exp-03-25     |             |                    |             |                |
| gemini-2.0-flash-001         |             |                    |             |                |
| gemini-1.5-pro               |             |                    |             |                |
| gemini-1.5-pro-latest        |             |                    |             |                |
| gemini-1.5-flash             |             |                    |             |                |
| gemini-1.5-flash-latest      |             |                    |             |                |
| gemini-1.5-flash-8b          |             |                    |             |                |
| gemini-1.5-flash-8b-latest   |             |                    |             |                |

---

## Embedding Models

```ts
const model = google.textEmbeddingModel('text-embedding-004');
```

With custom output dimensions:

```ts
const model = google.textEmbeddingModel('text-embedding-004', {
  outputDimensionality: 512,
});
```

### Embedding Model Dimensions

| Model              | Default Dimensions | Custom Dimensions |
|-------------------|--------------------|-------------------|
| text-embedding-004| 768                | ✔                 |
```
