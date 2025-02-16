import React, { ReactNode } from 'react';
import type { ChatMessageAnnotation } from '@/types/store';

export const renderContent = (
  content: string,
  annotations: ChatMessageAnnotation[]
) => {
  let footnoteIndex = 1;
  const footnotes: ReactNode[] = [];

  // Ensure annotations is an array
  if (!Array.isArray(annotations)) {
    return <div dangerouslySetInnerHTML={{ __html: content }} />;
  }

  const processedContent = annotations.reduce((processedContent, ann) => {
    const pattern = new RegExp(`【${ann.start_index}:${ann.end_index}†[^】]+】`, 'g');
    const replacement = `<sup>${footnoteIndex}</sup>`;
    footnotes.push(
      <div key={`footnote-${footnoteIndex}`} id={`footnote-${footnoteIndex}`} className="modal hidden">
        <div className="modal-content">
          <span className="close" onClick={() => hideModal(footnoteIndex)}>&times;</span>
          <p><strong>{footnoteIndex}:</strong> {ann.text || 'No additional information available.'}</p>
          <p><span className="tooltip">File ID: {ann.file_id || 'N/A'}</span></p>
        </div>
      </div>
    );
    footnoteIndex++;
    return processedContent.replace(pattern, replacement);
  }, content);

  return (
    <div>
      <div dangerouslySetInnerHTML={{ __html: processedContent }} />
      <div className="footnotes">
        {footnotes.map((footnote) => footnote)}
      </div>
    </div>
  );
};

function showModal(index: number) {
  const modal = document.getElementById(`footnote-${index}`);
  if (modal) {
    modal.classList.remove('hidden');
  }
}

function hideModal(index: number) {
  const modal = document.getElementById(`footnote-${index}`);
  if (modal) {
    modal.classList.add('hidden');
  }
}

export async function renderContentAsync(text: string, annotations: ChatMessageAnnotation[] = []): Promise<ReactNode> {
  const processedContent = renderContent(text, annotations);

  // Convert processedContent to a string for splitting
  const contentString = processedContent as unknown as string;
  const paragraphs = contentString.split(/<\/div><div>/);
  const formattedText: ReactNode[] = paragraphs.map((paragraph: string, index: number) => (
    <p key={`paragraph-${index}`} dangerouslySetInnerHTML={{ __html: paragraph }} />
  ));

  return formattedText;
}