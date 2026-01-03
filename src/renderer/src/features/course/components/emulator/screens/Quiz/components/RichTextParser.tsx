import React from 'react';

interface RichTextParserProps {
  content: string;
  onGapFound?: (id: string) => React.ReactNode;
}

export const RichTextParser: React.FC<RichTextParserProps> = ({ content, onGapFound }) => {
  if (!content) return null;

  // Split by tags we care about: </gap ...>, </n>, <p...>, </p>
  const parts = content.split(/((?:<\/gap id='.*?'>)|(?:<\/n\s*?>)|(?:<p.*?>)|(?:<\/p>))/gi);

  const widgets: React.ReactNode[] = [];
  let isBold = false;
  let isCenter = false;
  let fontSize: string | undefined = undefined;

  parts.forEach((part, index) => {
    // Gap Tag
    const gapMatch = part.match(/<\/gap id='(.*?)'>/i);
    if (gapMatch) {
      if (onGapFound) {
        const id = gapMatch[1];
        widgets.push(<React.Fragment key={`gap-${index}`}>{onGapFound(id)}</React.Fragment>);
      }
      return;
    }

    // Newline Tag
    if (part.toLowerCase().startsWith('</n')) {
      widgets.push(<div key={`nl-${index}`} className="w-full h-4" />);
      return;
    }

    // Paragraph Tag (Open)
    if (part.toLowerCase().startsWith('<p')) {
      const lowerPart = part.toLowerCase();
      if (lowerPart.includes('bold')) isBold = true;
      if (lowerPart.includes('center')) isCenter = true;

      const sizeMatch = part.match(/\d+/);
      if (sizeMatch) {
        fontSize = `${sizeMatch[0]}px`;
      }

      if (isCenter) {
        widgets.push(<div key={`p-center-pre-${index}`} className="w-full h-2" />);
      }
      return;
    }

    // Paragraph Tag (Close)
    if (part.toLowerCase() === '</p>') {
      isBold = false;
      const wasCenter = isCenter;
      isCenter = false;
      fontSize = undefined;
      // if (!wasCenter) {
      //   widgets.push(<div key={`p-close-${index}`} className="w-full h-2" />);
      // }
      return;
    }

    // Text content
    if (!part) return;

    const style: React.CSSProperties = {
      fontWeight: isBold ? 'bold' : 'normal',
      fontSize: fontSize,
    };

    const className = isCenter ? 'w-full text-center block' : '';

    widgets.push(
      <span
        key={`text-${index}`}
        style={style}
        className={className}
        dangerouslySetInnerHTML={{ __html: part }}
      />,
    );
  });

  return <>{widgets}</>;
};
