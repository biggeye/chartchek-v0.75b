import React, { ReactNode } from 'react';
import type { ChatMessageAnnotation } from '@/types/store';

export const renderContent = (
  content: string,
  annotations: ChatMessageAnnotation[]
) => {
  return annotations.reduce((processedContent, ann) => {
    const pattern = new RegExp(`【${ann.start_index}:${ann.end_index}†[^】]+】`, 'g');
    const replacement = ann.file_citation 
      ? `[${ann.file_citation.file_id}]` 
      : 'Unreferenced';
    return processedContent.replace(pattern, replacement);
  }, content);
};

export async function renderContentAsync(text: string, annotations: ChatMessageAnnotation[] = []): Promise<ReactNode> {
  const processedContent = renderContent(text, annotations);

  // Split text into paragraphs
  const paragraphs = processedContent.split(/\r\n\r\n/);
  const formattedText: ReactNode[] = paragraphs.map((paragraph, index) => {
    const formattedParagraph: ReactNode[] = [];
    let lastBoldIndex = 0;
    let boldMatch: RegExpExecArray | null;
    const boldPattern = /(?:\d+\.)?\s*\*\*(.*?)\*\*:?/g;

    while ((boldMatch = boldPattern.exec(paragraph)) !== null) {
      formattedParagraph.push(paragraph.slice(lastBoldIndex, boldMatch.index));
      formattedParagraph.push(<strong key={`bold-${index}-${boldMatch.index}`}>{boldMatch[1]}</strong>);
      lastBoldIndex = boldPattern.lastIndex;
    }
    formattedParagraph.push(paragraph.slice(lastBoldIndex));
    return <p key={`paragraph-${index}`}>{formattedParagraph}</p>;
  });

  // Footnotes
  const footnotes: ReactNode[] = [];
  if (annotations.length > 0) {
    const regex = /【(\d+):(\d+)†([^】]+)】/g;
    let lastIndex = 0;
    let refIndex = 1;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const snippetStart = Math.max(match.index - 35, 0);
      const snippet = text.slice(snippetStart, match.index);
      const tooltipSnippet = '...' + snippet;
      const combinedTooltip = `${match[3]} ${tooltipSnippet}`;

      footnotes.push(
        <div key={`foot-${refIndex}`} style={{ display: 'inline-block', marginRight: '4px', textAlign: 'center' }}>
          <sup style={{ cursor: 'pointer' }} title={combinedTooltip}>{refIndex}</sup>
        </div>
      );
      refIndex++;
      lastIndex = regex.lastIndex;
    }
  }

  return (
    <div key="content-wrapper">
      <span>{formattedText}</span>
      {footnotes.length > 0 && <div className="annotation-footnotes">{footnotes}</div>}
    </div>
  );
}