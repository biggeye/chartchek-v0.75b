import React, { ReactNode } from 'react';
import type { ChatMessageAnnotation } from '@/types/database';

interface ProcessedContent {
  content: string;
  footnotes: { index: number; annotation: ChatMessageAnnotation }[];
  pageReferences: { index: number; pageRange: string }[];
}

const processAnnotations = (
  content: string,
  annotations: ChatMessageAnnotation[] = []
): ProcessedContent => {
  if (!content) return { content: '', footnotes: [], pageReferences: [] };
  if (!annotations || !Array.isArray(annotations) || annotations.length === 0) {
    return { content, footnotes: [], pageReferences: [] };
  }

  let footnotes: { index: number; annotation: ChatMessageAnnotation }[] = [];
  let pageReferences: { index: number; pageRange: string }[] = [];
  let footnoteCounter = 1;

  // Sort annotations descending by end_index to avoid index shifting issues.
  const sortedAnnotations = [...annotations].sort((a, b) => b.end_index - a.end_index);
  sortedAnnotations.forEach((ann) => {
    const { start_index, end_index } = ann;
    if (start_index !== undefined && end_index !== undefined) {
      footnotes.push({ index: footnoteCounter, annotation: ann });
      // Insert a simple superscript marker without any modal logic.
      content =
        content.slice(0, end_index) +
        `<sup class="footnote-indicator" data-index="${footnoteCounter}">${footnoteCounter}</sup>` +
        content.slice(end_index);
      footnoteCounter++;
    }
  });

  // Replace page reference markers ([number-number]) with anchor tags.
  let pageRefCounter = 1;
  content = content.replace(/\[(\d+-\d+)\]/g, (match, range) => {
    pageReferences.push({ index: pageRefCounter, pageRange: range });
    const link = `<a class="page-indicator" data-index="${pageRefCounter}" href="javascript:void(0)">${pageRefCounter}</a>`;
    pageRefCounter++;
    return link;
  });

  return { content, footnotes, pageReferences };
};

// Simple formatting: converts markdown-style headers, bullet lists, and paragraphs.
const applyFormatting = (content: string): string => {
  // Replace markdown bold with <strong>.
  content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Split content by double newlines into blocks.
  const blocks = content.split('\n\n').map(block => block.trim()).filter(Boolean);
  const formattedBlocks = blocks.map(block => {
    // If the block starts with '### ' (after trimming), treat it as a major title and use <h2>.
    if (/^#{3}\s+/.test(block)) {
      return `<h2>${block.replace(/^#{3}\s+/, '').trim()}</h2>`;
    }
    // If the block starts with '#### ' (after trimming), treat it as a secondary title and use <h3>.
    if (/^#{4}\s+/.test(block)) {
      return `<h3>${block.replace(/^#{4}\s+/, '').trim()}</h3>`;
    }
    // Convert bullet lists: lines starting with '- ' are wrapped in <ul> and <li>.
    if (block.startsWith('- ')) {
      const items = block
        .split('\n')
        .filter(line => line.startsWith('- '))
        .map(item => `<li>${item.substring(2).trim()}</li>`);
      return `<ul>${items.join('')}</ul>`;
    }
    // Otherwise, wrap the block in a paragraph.
    return `<p>${block}</p>`;
  });
  return formattedBlocks.join('');
};


interface ChatbotContentProps {
  content: string;
  annotations?: ChatMessageAnnotation[];
}

export const ChatbotContent: React.FC<ChatbotContentProps> = ({ content, annotations = [] }) => {
  if (!content) return null;

  // Process annotations and then format the resulting content.
  const { content: processedText } = processAnnotations(content, annotations);
  const formattedContent = applyFormatting(processedText);

  return (
    <div className="chatbot-content" dangerouslySetInnerHTML={{ __html: formattedContent }} />
  );
};

export const renderContent = (
  text: string,
  annotations: ChatMessageAnnotation[] = []
): ReactNode => {
  return <ChatbotContent content={text} annotations={annotations} />;
};

export const renderContentAsync = async (
  text: string,
  annotations: ChatMessageAnnotation[] = []
): Promise<ReactNode> => {
  return renderContent(text, annotations);
};
