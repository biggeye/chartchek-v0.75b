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

  // Process citations in the format【index:page†source】or [index:page†source]
  content = content.replace(/(?:【|\[)(\d+):(\d+)†([^】\]]+)(?:】|\])/g, (match, index, page, source) => {
    const citationIndex = footnotes.length + 1;
    footnotes.push({ 
      index: citationIndex, 
      annotation: {
        type: 'file_citation',
        start_index: 0,
        end_index: 0,
        text: `${source}, page ${page}`,
        file_citation: { file_id: `source-${index}` }
      } 
    });
    return `<sup class="citation-indicator" data-index="${citationIndex}">[${citationIndex}]</sup>`;
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

// Enhanced formatting: converts markdown-style elements to HTML
const applyFormatting = (content: string): string => {
  if (!content) return '';

  // Pre-process some common patterns before splitting into blocks
  
  // Convert standalone ### (used as section dividers)
  content = content.replace(/^#+\s*$/gm, '<div class="section-divider my-6 border-t-2 border-gray-200"></div>');
  
  // Handle section headings with ### followed by a title (like "### Initial Assessment:")
  content = content.replace(/^###\s+([^:\n]+):(.*)$/gm, function(match, title, rest) {
    return `\n\n<h3 class="text-lg font-bold mt-6 mb-3 text-primary">${title}</h3>${rest}\n\n`;
  });
  
  // Handle numbered items with bold headers (like "1. **Complete a Comprehensive Assessment:**")
  content = content.replace(/^(\d+)\.\s+\*\*([^*:]+)\*\*:(.*)$/gm, function(match, number, title, rest) {
    return `<div class="ml-0 mb-3">
      <div class="font-bold flex items-baseline">
        <span class="mr-2">${number}.</span>
        <span>${title}:</span>
      </div>${rest}
    </div>`;
  });
  
  // Handle bold subsections (- **Title**:)
  content = content.replace(/^\s*-\s+\*\*([^*:]+)\*\*:(.*)$/gm, function(match, title, rest) {
    return `<div class="ml-6 mb-2">
      <strong class="text-gray-800">${title}:</strong>${rest}`;
  });
  
  // Handle plain bullet points
  content = content.replace(/^\s*-\s+([^*\n][^\n]*)$/gm, function(match, text) {
    return `<div class="ml-6 mb-2 flex">
      <span class="inline-block w-1.5 h-1.5 mt-2 mr-2 rounded-full bg-gray-500"></span>
      <span>${text}</span>
    </div>`;
  });
  
  // Close divs before new sections or list items
  content = content.replace(/\n(?=\s*-\s+|\d+\.\s+|###)/gm, '</div>\n');
  
  // Ensure all opened divs are closed at the end
  if ((content.match(/<div/g) || []).length > (content.match(/<\/div>/g) || []).length) {
    content += '</div>';
  }

  // Replace markdown bold with <strong>
  content = content.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
  
  // Replace markdown italic with <em>
  content = content.replace(/\*([^*]+?)\*/g, '<em>$1</em>');

  // Handle code blocks (```)
  const codeBlockRegex = /```([a-z]*)\n([\s\S]*?)```/g;
  content = content.replace(codeBlockRegex, (match, language, code) => {
    return `<div class="code-block ${language ? `language-${language}` : ''}"><pre>${code.trim()}</pre></div>`;
  });

  // Handle inline code (`)
  content = content.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Split content by double newlines into blocks.
  const blocks = content.split('\n\n').map(block => block.trim()).filter(Boolean);
  const formattedBlocks = blocks.map(block => {
    // Check for HTML elements we've already generated
    if (block.startsWith('<h3') || 
        block.startsWith('<div class="section-divider') || 
        block.startsWith('<div class="ml-')) {
      return block;
    }
    
    // Heading 1
    if (/^#\s+/.test(block)) {
      return `<h1 class="text-2xl font-bold my-4">${block.replace(/^#\s+/, '').trim()}</h1>`;
    }
    
    // Heading 2
    if (/^#{2}\s+/.test(block)) {
      return `<h2 class="text-xl font-bold my-3">${block.replace(/^#{2}\s+/, '').trim()}</h2>`;
    }
    
    // Heading 3 (not already processed)
    if (/^#{3}\s+/.test(block)) {
      return `<h3 class="text-lg font-semibold my-3 text-primary">${block.replace(/^#{3}\s+/, '').trim()}</h3>`;
    }
    
    // Heading 4
    if (/^#{4}\s+/.test(block)) {
      return `<h4 class="text-base font-semibold my-2">${block.replace(/^#{4}\s+/, '').trim()}</h4>`;
    }
    
    // Special case for numbering prefixes followed by text (like "3. Design Interventions:")
    if (/^\d+\.\s+[A-Z]/.test(block)) {
      return `<h4 class="text-base font-semibold my-2">${block}</h4>`;
    }

    // Unordered bullet lists (both - and • are supported)
    if (block.split('\n').some(line => line.trim().startsWith('- ') || line.trim().startsWith('• '))) {
      const listItems = block
        .split('\n')
        .map(line => {
          if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
            return `<li>${line.replace(/^[-•]\s+/, '').trim()}</li>`;
          }
          return line; // Keep non-list lines as is
        })
        .join('');
      return `<ul class="list-disc pl-6 my-2">${listItems}</ul>`;
    }

    // Ordered numbered lists (1., 2., etc.)
    if (block.split('\n').some(line => /^\d+\.\s/.test(line.trim()))) {
      // Check if this is actually a list of items or just a numbered heading
      const lines = block.split('\n');
      if (lines.length > 1 || !(/[A-Z]/.test(lines[0]))) {
        const listItems = lines
          .map(line => {
            if (/^\d+\.\s/.test(line.trim())) {
              return `<li>${line.replace(/^\d+\.\s+/, '').trim()}</li>`;
            }
            return line; // Keep non-list lines as is
          })
          .join('');
        return `<ol class="list-decimal pl-6 my-2">${listItems}</ol>`;
      }
    }

    // Handle lines that start with "- " as bullet points but aren't full blocks
    if (block.startsWith('- ')) {
      return `<div class="pl-6 my-2"><span class="inline-block w-1.5 h-1.5 rounded-full bg-gray-500 mr-2"></span>${block.substring(2)}</div>`;
    }

    // Check if the block is a section with bold title followed by content
    const boldTitleMatch = block.match(/^\*\*(.*?)\*\*:(.*)$/);
    if (boldTitleMatch) {
      const [, title, content] = boldTitleMatch;
      return `<div class="section-with-title my-2">
        <span class="font-bold">${title}:</span>${content}
      </div>`;
    }

    // Check for introduction or summary paragraphs
    if (block.includes("Joint Commission") || block.startsWith("To create a treatment plan") || block.startsWith("This plan is developed")) {
      return `<p class="my-3">${block}</p>`;
    }

    // Otherwise, wrap the block in a paragraph.
    return `<p class="my-2">${block}</p>`;
  });

  let result = formattedBlocks.join('');
  
  // Additional passes to clean up any remaining patterns
  
  // Convert standalone number + period + space at the beginning of a line to a styled item
  result = result.replace(/<p[^>]*>(\d+)\.\s+([^<]*)<\/p>/g, (match, number, content) => {
    return `<div class="flex my-2">
      <div class="mr-2 font-semibold">${number}.</div>
      <div>${content}</div>
    </div>`;
  });
  
  // Clean up any potential nesting issues
  result = result.replace(/<\/div>\s*<\/div>/g, '</div>');
  result = result.replace(/<div[^>]*><\/div>/g, '');
  
  return result;
};

interface ChatbotContentProps {
  content: string;
  annotations?: ChatMessageAnnotation[];
}

export const ChatbotContent: React.FC<ChatbotContentProps> = ({ content, annotations = [] }) => {
  if (!content) return null;

  // Process annotations and then format the resulting content.
  const { content: processedText, footnotes } = processAnnotations(content, annotations);
  const formattedContent = applyFormatting(processedText);

  return (
    <div className="chatbot-content">
      <div dangerouslySetInnerHTML={{ __html: formattedContent }} />
      
      {/* Render citations/footnotes if any */}
      {footnotes.length > 0 && (
        <div className="mt-4 pt-2 border-t border-gray-200 text-sm">
          {footnotes.map(({ index, annotation }) => (
            <div key={`footnote-${index}`} className="flex gap-1 text-muted-foreground mb-1">
              <span className="font-medium">[{index}]</span>
              <span>{annotation.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
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
