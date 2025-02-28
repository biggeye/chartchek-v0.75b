'use client';

/**
 * Client-side utility functions for interacting with OpenAI via the Next.js API routes
 * This file does NOT directly use the OpenAI client, which is only used server-side
 */

/**
 * Creates a new thread via the API
 * @returns The ID of the created thread
 */
export async function createThread(): Promise<string> {
  const response = await fetch('/api/threads', { method: 'POST' });
  
  if (!response.ok) {
    throw new Error(`Failed to create thread: ${response.status}`);
  }
  
  const { threadId } = await response.json();
  
  if (!threadId) {
    throw new Error('No thread ID returned from API');
  }
  
  return threadId;
}

/**
 * Creates a new message in a thread
 * @param threadId The ID of the thread
 * @param content The content of the message
 * @returns The ID of the created message
 */
export async function createMessage(threadId: string, content: string): Promise<string> {
  const response = await fetch(`/api/threads/${threadId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create message: ${response.status}`);
  }
  
  const { messageId } = await response.json();
  
  if (!messageId) {
    throw new Error('No message ID returned from API');
  }
  
  return messageId;
}

/**
 * Starts a run in a thread
 * @param threadId The ID of the thread
 * @param assistantId The ID of the assistant
 * @returns The ID of the created run
 */
export async function createRun(threadId: string, assistantId: string): Promise<string> {
  const response = await fetch(`/api/threads/${threadId}/runs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ assistantId }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create run: ${response.status}`);
  }
  
  const { runId } = await response.json();
  
  if (!runId) {
    throw new Error('No run ID returned from API');
  }
  
  return runId;
}
