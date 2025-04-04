import { NextRequest, NextResponse } from "next/server";
import { getOpenAIClient } from "@/utils/ai/openai/server";
import { OpenAI } from "openai";
import { z } from "zod";

const requestSchema = z.object({
  threadId: z.string(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { threadId: string } }
) {
  try {
    const threadId = await params.threadId;
    
    const openai = getOpenAIClient();
    
    // Get thread messages
    const messages = await openai.beta.threads.messages.list(threadId);
    
    // Extract content from messages
    const messageContents = messages.data.map((message) => {
      const content = message.content[0];
      if (content.type === "text") {
        return content.text.value;
      }
      return "";
    }).filter(Boolean);
    
    // Generate title using OpenAI
    const titleResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that generates concise, descriptive titles based on conversation content. Keep titles under 50 characters."
        },
        {
          role: "user",
          content: `Generate a short, descriptive title for this conversation: ${messageContents.join("\n\n")}`
        }
      ],
      max_tokens: 50,
    });
    
    const title = titleResponse.choices[0]?.message?.content?.trim() || "New Conversation";
    
    return NextResponse.json({ title }, { status: 200 });
  } catch (error) {
    console.error("Error generating title:", error);
    return NextResponse.json(
      { error: "Failed to generate title" },
      { status: 500 }
    );
  }
}