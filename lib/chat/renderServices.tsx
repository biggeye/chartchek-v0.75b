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

  // Process annotations based on their type
  annotations.forEach((ann) => {
    const start = ann.start_index;
    const end = ann.end_index;
    
    if (start !== undefined && end !== undefined) {
      footnotes.push({ index: footnoteCounter, annotation: ann });
      // Insert footnote marker at the end of the annotated text
      const beforeMarker = content.slice(0, end);
      const afterMarker = content.slice(end);
      content = beforeMarker + `<sup class="footnote-indicator" data-index="${footnoteCounter}">${footnoteCounter}</sup>` + afterMarker;
      footnoteCounter++;
    }
  });

  // Replace page reference markers ([number-number])
  let pageRefCounter = 1;
  const contentAfterPages = content.replace(/\[(\d+-\d+)\]/g, (match, range) => {
    pageReferences.push({ index: pageRefCounter, pageRange: range });
    const link = `<a class="page-indicator" data-index="${pageRefCounter}" href="javascript:void(0)">${pageRefCounter}</a>`;
    pageRefCounter++;
    return link;
  });

  return { content: contentAfterPages, footnotes, pageReferences };
};

const applyFormatting = (content: string): string => {
  // 1. Wrap marker text in numbered list items
  content = content.replace(/(^|\n)(\d+\.\s*)([^:]+)(:)/gm, '$1<div>$2<strong>$3</strong>$4</div>');

  // 2. Split and wrap by line
  const lines = content.split('\n');
  const paragraphs: string[] = [];
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    if (trimmed.includes('**')) {
      // Split while preserving any **…** segments.
      const parts = trimmed.split(/(\*\*.+?\*\*)/g);
      parts.forEach((part) => {
        const partTrimmed = part.trim();
        if (!partTrimmed) return;
        if (/^\*\*(.+?)\*\*$/.test(partTrimmed)) {
          const boldText = partTrimmed.replace(/^\*\*(.+?)\*\*$/, '<strong>$1</strong>');
          paragraphs.push(`<span>${boldText}</span>`);
        } else {
          paragraphs.push(`<span>${partTrimmed}</span>`);
        }
      });
    } else {
      paragraphs.push(`<span>${trimmed}</span>`);
    }
  });
  return paragraphs.join('');
};

const insertMarkerSpacing = (html: string): string => {
  // Insert a space between adjacent superscript markers.
  html = html.replace(/(<\/sup>)(<sup)/g, '$1 $2');
  // Insert a space between adjacent page reference links.
  html = html.replace(/(<\/a>)(<a)/g, '$1 $2');
  return html;
};

interface FootnoteModalProps {
  index: number;
  annotation: ChatMessageAnnotation;
  onClose: (id: string) => void;
}

const FootnoteModal: React.FC<FootnoteModalProps> = ({ index, annotation, onClose }) => {
  let fileId = '';
  if (annotation.file_citation) {
    fileId = annotation.file_citation.file_id;
  } else if (annotation.file_path) {
    fileId = annotation.file_path.file_id;
  }

  return (
    <div id={`footnote-${index}`} className="footnote-modal" style={{ display: 'none' }}>
      <div className="modal-content">
        <button className="close" onClick={() => onClose(`footnote-${index}`)}>&times;</button>
        <div>
          <strong>{index}:</strong> {annotation.text || 'No additional information available.'}
        </div>
        {fileId && (
          <div>
            <span className="tooltip">File ID: {fileId}</span>
          </div>
        )}
      </div>
    </div>
  );
};

interface PageRefModalProps {
  index: number;
  fileId: string;
  pageRange: string;
  onClose: (id: string) => void;
}

const PageRefModal: React.FC<PageRefModalProps> = ({ index, fileId, pageRange, onClose }) => {
  return (
    <div id={`page-ref-${index}`} className="page-ref-modal" style={{ display: 'none' }}>
      <div className="modal-content">
        <button className="close" onClick={() => onClose(`page-ref-${index}`)}>&times;</button>
        <div>
          <strong>{index}:</strong> {fileId}: {pageRange}
        </div>
      </div>
    </div>
  );
};

interface ChatbotContentProps {
  content: string;
  annotations?: ChatMessageAnnotation[];
}

export const ChatbotContent: React.FC<ChatbotContentProps> = ({ content, annotations = [] }) => {
  if (!content) return null;

  // Process the markers in the content.
  const { content: processedText, footnotes, pageReferences } = processAnnotations(content, annotations);
  // Apply further formatting.
  let formattedContent = applyFormatting(processedText).replace(/<p>/g, '<div>').replace(/<\/p>/g, '</div>');
  // Insert spacing between adjacent markers.
  formattedContent = insertMarkerSpacing(formattedContent);

  // Handlers for showing/hiding modals using inline styles.
  const showModal = (id: string) => {
    const modal = document.getElementById(id);
    if (modal) {
      modal.style.display = 'block';
    }
  };

  const hideModal = (id: string) => {
    const modal = document.getElementById(id);
    if (modal) {
      modal.style.display = 'none';
    }
  };

  // Event delegation: if a footnote (<sup>) or page reference (<a>) is clicked, show its modal.
  const onContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('footnote-indicator')) {
      const idx = target.getAttribute('data-index');
      if (idx) showModal(`footnote-${idx}`);
    }
    if (target.classList.contains('page-indicator')) {
      const idx = target.getAttribute('data-index');
      if (idx) showModal(`page-ref-${idx}`);
    }
  };

  return (
    <div className="chatbot-content" onClick={onContentClick}>
      <div dangerouslySetInnerHTML={{ __html: formattedContent }} />
      {footnotes.map(({ index, annotation }) => (
        <FootnoteModal
          key={`footnote-${index}`}
          index={index}
          annotation={annotation}
          onClose={hideModal}
        />
      ))}
      {pageReferences.map(({ index, pageRange }) => (
        <PageRefModal
          key={`page-ref-${index}`}
          index={index}
          fileId="document"
          pageRange={pageRange}
          onClose={hideModal}
        />
      ))}
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