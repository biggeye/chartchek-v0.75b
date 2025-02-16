import { describe, test, expect } from 'vitest';
import type { Message, ChatMessageAnnotation } from '../../types/store';

describe('Message Transformation', () => {
  test('converts Supabase timestamp to Unix', () => {
    const supabaseData = {
      message_id: '1',
      created_at: '2023-01-01T00:00:00Z',
      thread_id: 'thread_123',
      role: 'user',
      content: {
        text: {
          value: 'test',
          annotations: []
        }
      }
    };
    
    const transformed: Message = {
      id: '1',
      created_at: new Date(supabaseData.created_at).getTime(),
      thread_id: 'thread_123',
      role: 'user',
      content: {
        type: 'text',
        text: {
          value: 'test',
          annotations: []
        }
      }
    };

    expect(transformed.created_at).toBe(1672531200000);
  });
});
