import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient } from '@/utils/openai/server';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    // Get the OpenAI client
    const openai = getOpenAIClient();
    console.log('Generating title for message:', message)
    // Generate a concise title using GPT-3.5-turbo
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that generates concise, descriptive titles for chat conversations. Create a title that is 3-7 words long based on the first message in the conversation.'
        },
        {
          role: 'user',
          content: `Generate a concise title (3-7 words) for a conversation that starts with this message: "${message}"`
        }
      ],
      temperature: 0.7,
      max_tokens: 25,
    });

    // Extract the generated title
    const title = response.choices[0]?.message?.content?.trim() || 'New conversation';
    console.log('Generated title:', title)
    return NextResponse.json({ title });
  } catch (error) {
    console.error('Error generating title:', error);
    return NextResponse.json(
      { error: 'Failed to generate title' },
      { status: 500 }
    );
  }
}
