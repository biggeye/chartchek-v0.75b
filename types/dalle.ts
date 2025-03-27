// types/dalle.ts
export type Dalle3Size = "1024x1024" | "1792x1024" | "1024x1792";
export type Dalle3Quality = "standard" | "hd";
export type Dalle3Style = "vivid" | "natural";
export type Dalle3ResponseFormat = "url" | "b64_json";

export interface Dalle3Params {
  prompt: string;
  model?: string;
  n?: number;
  quality?: Dalle3Quality;
  response_format?: Dalle3ResponseFormat;
  size?: Dalle3Size;
  style?: Dalle3Style;
  user?: string;
}

export interface Dalle3Response {
  success: boolean;
  data?: {
    imageUrl: string;
    openaiFileId: string;
    record: any;
  };
  error?: string;
  details?: any;
}