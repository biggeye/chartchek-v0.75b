import React, { ReactNode, ReactElement, JSXElementConstructor } from 'react';

interface ChatMessageAnnotation {
  text: string;
  type: string;
  index: number;
  end_index: number;
  start_index: number;
  file_citation: {
    quote: string;
    file_id: string;
  };
}

export async function renderContent(text: string, annotations: ChatMessageAnnotation[] = []): Promise<ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | Awaited<ReactNode>> {
  const formattedText: ReactNode[] = [];

  // Split text into paragraphs
  const paragraphs = text.split(/\r\n\r\n/);
  paragraphs.forEach((paragraph, index) => {
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
    formattedText.push(<p key={`paragraph-${index}`}>{formattedParagraph}</p>);
  });

  // Process annotations
  if (annotations.length > 0) {
    const regex = /【(\d+):(\d+)†([^】]+)】/g;
    let lastIndex = 0;
    let refIndex = 1;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      formattedText.push(text.slice(lastIndex, match.index));
      formattedText.push(<sup key={`footnote-${refIndex}`}>{refIndex}</sup>);
      lastIndex = regex.lastIndex;
      refIndex++;
    }
    formattedText.push(text.slice(lastIndex));
  } else {
    formattedText.push(text);
  }

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