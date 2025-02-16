import React, { ReactNode } from 'react';
import type { ChatMessageAnnotation } from '@/types/store';

interface ProcessedContent {
  content: string;
  footnotes: { index: number; annotation: ChatMessageAnnotation }[];
  pageReferences: { index: number; pageRange: string }[];
}

/*
  processAnnotations() processes two kinds of markers:
  
  1. Annotation markers of the form
       【start_index:end_index†filename】
     These are replaced with a <sup> marker. A parallel footnotes array is built.
     
  2. Page references of the form “[number-number]”
     These are replaced with an <a> marker. A parallel pageReferences array is built.
     
  (The ordering in both cases is assumed to match.)
*/
const processAnnotations = (
  content: string,
  annotations: ChatMessageAnnotation[]
): ProcessedContent => {
  let footnotes: { index: number; annotation: ChatMessageAnnotation }[] = [];
  let pageReferences: { index: number; pageRange: string }[] = [];
  let footnoteCounter = 1;

  // Replace annotation markers (【…】)
  const contentAfterAnnotations = content.replace(/【(\d+):(\d+)†([^】]+)】/g, (match, start, end, file) => {
    const ann = annotations[footnoteCounter - 1] || { start_index: start, end_index: end, file_id: file, text: '' };
    footnotes.push({ index: footnoteCounter, annotation: ann });
    const sup = `<sup class="footnote-indicator" data-index="${footnoteCounter}">${footnoteCounter}</sup>`;
    footnoteCounter++;
    return sup;
  });

  // Replace page reference markers ([number-number])
  let pageRefCounter = 1;
  const contentAfterPages = contentAfterAnnotations.replace(/\[(\d+-\d+)\]/g, (match, range) => {
    pageReferences.push({ index: pageRefCounter, pageRange: range });
    const link = `<a class="page-indicator" data-index="${pageRefCounter}" href="javascript:void(0)">${pageRefCounter}</a>`;
    pageRefCounter++;
    return link;
  });

  return { content: contentAfterPages, footnotes, pageReferences };
};

/*
  applyFormatting() performs further text transformations:
  
  1. It wraps the text between a numbered list indicator (e.g. “1. Coverage Termination:”) in a <strong> tag.
  
  2. It splits any line containing markdown bold (**…**) so that the bold text appears as its own paragraph.
  
  3. It wraps each nonempty token in a <p> tag.
*/
const applyFormatting = (content: string): string => {
  // 1. Wrap marker text in numbered list items
  content = content.replace(/(^|\n)(\d+\.\s*)([^:]+)(:)/gm, '$1$2<strong>$3</strong>$4');

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
          paragraphs.push(`<p>${boldText}</p>`);
        } else {
          paragraphs.push(`<p>${partTrimmed}</p>`);
        }
      });
    } else {
      paragraphs.push(`<p>${trimmed}</p>`);
    }
  });
  return paragraphs.join('');
};

/*
  --- Post-processing helper ---
  Inserts a space between adjacent markers so that two consecutive <sup> or <a> tags don’t merge into one.
*/
const insertMarkerSpacing = (html: string): string => {
  // Insert a space between adjacent superscript markers.
  html = html.replace(/(<\/sup>)(<sup)/g, '$1 $2');
  // Insert a space between adjacent page reference links.
  html = html.replace(/(<\/a>)(<a)/g, '$1 $2');
  return html;
};

/*
  FootnoteModal displays the annotation details.
  It is hidden by default via inline style (display: 'none').
  When its corresponding <sup> marker is clicked, its display is toggled.
*/
interface FootnoteModalProps {
  index: number;
  annotation: ChatMessageAnnotation;
  onClose: (id: string) => void;
}
const FootnoteModal: React.FC<FootnoteModalProps> = ({ index, annotation, onClose }) => {
  return (
    <div id={`footnote-${index}`} className="footnote-modal" style={{ display: 'none' }}>
      <div className="modal-content">
        <button className="close" onClick={() => onClose(`footnote-${index}`)}>&times;</button>
        <p>
          <strong>{index}:</strong> {annotation.text || 'No additional information available.'}
        </p>
        <p>
          <span className="tooltip">File ID: {annotation.file_id || 'N/A'}</span>
        </p>
      </div>
    </div>
  );
};

/*
  PageRefModal displays details for a page reference.
  It is hidden by default via inline style.
*/
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
        <p>
          <strong>{index}:</strong> {fileId}: {pageRange}
        </p>
      </div>
    </div>
  );
};

/*
  ChatbotContent renders the processed content along with both kinds of modals.
  When a <sup> (footnote marker) or <a> (page reference marker) is clicked, an event handler toggles 
  the display of the corresponding modal.
*/
interface ChatbotContentProps {
  content: string;
  annotations?: ChatMessageAnnotation[];
}
export const ChatbotContent: React.FC<ChatbotContentProps> = ({ content, annotations = [] }) => {
  // Process the markers in the content.
  const { content: processedText, footnotes, pageReferences } = processAnnotations(content, annotations);
  // Apply further formatting.
  let formattedContent = applyFormatting(processedText);
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
    <>
      <div onClick={onContentClick} dangerouslySetInnerHTML={{ __html: formattedContent }} />
      
      {/* Render the footnotes modals (hidden by default) */}
      <div className="footnotes">
        {footnotes.map(({ index, annotation }) => (
          <FootnoteModal key={`footnote-${index}`} index={index} annotation={annotation} onClose={hideModal} />
        ))}
      </div>
      {/* Render the page reference modals (hidden by default) */}
      <div className="page-references">
        {pageReferences.map((pr) => {
          // Find the corresponding annotation for file_id matching (if ordering matches).
          const correspondingAnnotation = footnotes.find((f) => f.index === pr.index);
          const fileId = correspondingAnnotation ? correspondingAnnotation.annotation.file_id || 'N/A' : 'N/A';
          return (
            <PageRefModal
              key={`page-ref-${pr.index}`}
              index={pr.index}
              fileId={fileId}
              pageRange={pr.pageRange}
              onClose={hideModal}
            />
          );
        })}
      </div>
    </>
  );
};

/*
  renderContent returns the ChatbotContent component synchronously.
*/
export const renderContent = (
  text: string,
  annotations: ChatMessageAnnotation[] = []
): ReactNode => {
  return <ChatbotContent content={text} annotations={annotations} />;
};

/*
  renderContentAsync is an asynchronous wrapper.
*/
export async function renderContentAsync(
  text: string,
  annotations: ChatMessageAnnotation[] = []
): Promise<ReactNode> {
  return <ChatbotContent content={text} annotations={annotations} />;
}