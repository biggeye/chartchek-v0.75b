'use client'

import { cn } from '@/lib/utils'
import { Text } from '@/components/ui/text'
import { renderContent } from '@/lib/chat/renderServices';
import { MessageContent as MessageContentType, ChatMessageAnnotation } from '@/types/supabase'

interface MessageContentProps {
  content: MessageContentType | any
  className?: string
  isStreaming?: boolean
  isAssistantLoading?: boolean
}

export default function MessageContent({ 
  content, 
  className, 
  isStreaming = false
}: MessageContentProps) {
  // Debug logging to understand the content structure
  console.log('[MessageContent] Rendering content:', content);
  
  // Normalize content to handle edge cases
  const normalizeContent = (rawContent: any): { type: string, text: { value: string, annotations: any[] } } | null => {
    if (!rawContent) return null;
    
    try {
      // Already properly formatted
      if (
        rawContent.type === 'text' && 
        rawContent.text && 
        typeof rawContent.text.value === 'string'
      ) {
        return rawContent;
      }
      
      // Content is just a string
      if (typeof rawContent === 'string') {
        return {
          type: 'text',
          text: {
            value: rawContent,
            annotations: []
          }
        };
      }
      
      // Content has a direct value property
      if (rawContent.value && typeof rawContent.value === 'string') {
        return {
          type: 'text',
          text: {
            value: rawContent.value,
            annotations: rawContent.annotations || []
          }
        };
      }
      
      // Content has text as a direct string
      if (rawContent.text && typeof rawContent.text === 'string') {
        return {
          type: 'text',
          text: {
            value: rawContent.text,
            annotations: []
          }
        };
      }
      
      // Content has a nested structure but wrong format
      if (rawContent.text && typeof rawContent.text === 'object') {
        const textValue = rawContent.text.value || '';
        const annotations = Array.isArray(rawContent.text.annotations) 
          ? rawContent.text.annotations 
          : [];
          
        return {
          type: 'text',
          text: {
            value: textValue,
            annotations: annotations
          }
        };
      }
      
      // Fallback for unknown format - stringify if object
      if (typeof rawContent === 'object') {
        return {
          type: 'text',
          text: {
            value: JSON.stringify(rawContent),
            annotations: []
          }
        };
      }
      
      // Final fallback
      return {
        type: 'text',
        text: {
          value: String(rawContent),
          annotations: []
        }
      };
    } catch (err) {
      console.error('[MessageContent] Error normalizing content:', err);
      return {
        type: 'text',
        text: {
          value: 'Error rendering content',
          annotations: []
        }
      };
    }
  };
  
  const normalizedContent = normalizeContent(content);
  
  if (!normalizedContent) {
    return <div className="text-red-500">Invalid content format</div>;
  }
  
  if (normalizedContent.type === 'text') {
    const textValue = normalizedContent.text.value || '';
    const annotations = normalizedContent.text.annotations || [];
    
    if (!textValue && !isStreaming) {
      console.warn('[MessageContent] No text content to render:', content);
    }

    return (
      <div className={cn(
        "message-content", 
        isStreaming && "streaming-content",
        className
      )}>
        {renderContent(textValue, annotations)}
        
        {/* Show cursor animation only during streaming */}
        {isStreaming && (
          <span className="inline-block w-2 h-4 ml-1 bg-primary animate-pulse-fast"></span>
        )}
        
        {annotations && annotations.length > 0 && (
          <div className="annotation-footnotes mt-2">
            {annotations.map((ann: ChatMessageAnnotation, index: number) => (
              <div key={`ann-${index}`} className="text-xs text-muted-foreground">
                [{index+1}] {ann.type}: {ann.file_citation?.file_id || ann.file_path?.file_id}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  } else if (normalizedContent.type === 'image_file') {
    // Handle image file content
    // TypeScript fix - using type assertion for image_file content
    const imageFileContent = normalizedContent as { type: string; image_file?: { file_id: string } };
    const fileId = imageFileContent.image_file?.file_id;
    return fileId ? (
      <div className={cn("message-content", className)}>
        <img src={`/api/openai/files/${fileId}`} alt="Image content" />
      </div>
    ) : null;
  } else if (normalizedContent.type === 'image_url') {
    // Handle image URL content
    // TypeScript fix - using type assertion for image_url content
    const imageUrlContent = normalizedContent as { type: string; image_url?: { url: string } };
    const url = imageUrlContent.image_url?.url;
    return url ? (
      <div className={cn("message-content", className)}>
        <img src={url} alt="Image content" />
      </div>
    ) : null;
  }
  return null;
}
