import React, { useEffect } from 'react';
import { useEmulatorEdit } from '../../../EmulatorEditContext';

// Color palette ensuring good visibility on both light and dark backgrounds
const COLOR_MAP: Record<string, string> = {
  primary: 'hsl(var(--primary))',
  red: '#ef4444', // red-500
  green: '#10b981', // emerald-500
  blue: '#3b82f6', // blue-500
  yellow: '#eab308', // yellow-500
  orange: '#f97316', // orange-500
  purple: '#8b5cf6', // violet-500
  gray: '#6b7280', // gray-500
  // Add more as needed
};

interface RichTextParserProps {
  content: string;
  onGapFound?: (id: string) => React.ReactNode;
  onTextClick?: (text: string) => void;
  onChange?: (newContent: string) => void;
}

export const RichTextParser: React.FC<RichTextParserProps> = ({
  content,
  onGapFound,
  onTextClick,
  onChange,
}) => {
  if (!content) return null;

  // Split by tags we care about: </gap ...>, </n>, <p...>, </p>
  const parts = content.split(/((?:<\/gap id='.*?'>)|(?:<\/n\s*?>)|(?:<p.*?>)|(?:<\/p>))/gi);

  const widgets: React.ReactNode[] = [];

  // State for parsing
  let isInParagraph = false;
  let currentParaStartIndex = -1;
  let pChildren: React.ReactNode[] = [];
  let pTextAccumulator = ''; // To track raw text for click handler

  // Paragraph attributes
  let isBold = false;
  let isCenter = false;
  let fontSize: string | undefined = undefined;
  let color: string | undefined = undefined;

  const flushParagraph = (closeIndex: number, startIndex: number) => {
    if (pChildren.length > 0) {
      const fullText = pTextAccumulator; // Capture current value
      const uniqueId = `p-${startIndex}-${closeIndex}`;

      const wrapperStyle: React.CSSProperties = {
        fontSize,
        color, // Apply color to wrapper so it inherits
        fontWeight: isBold ? 'bold' : 'normal',
      };

      const wrapperClass = `
        relative inline-block rounded-md border border-dashed border-transparent
        hover:border-primary/50 focus:border-primary focus:bg-primary/5 focus:outline-none
        transition-all duration-200 cursor-text
        px-1 -mx-1
        ${isCenter ? 'w-full text-center block' : ''}
      `.trim();

      widgets.push(
        <ParagraphWrapper
          key={uniqueId}
          id={uniqueId}
          className={wrapperClass}
          style={wrapperStyle}
          fullText={fullText}
          startIndex={startIndex}
          parts={parts}
          onChange={onChange}
          onTextClick={onTextClick}
        >
          {pChildren}
        </ParagraphWrapper>,
      );
    }
    // Reset
    pChildren = [];
    pTextAccumulator = '';
    isInParagraph = false;
    currentParaStartIndex = -1;
    isBold = false;
    isCenter = false;
    fontSize = undefined;
    color = undefined;
  };

  parts.forEach((part, index) => {
    // Gap Tag
    const gapMatch = part.match(/<\/gap id='(.*?)'>/i);
    if (gapMatch) {
      const gapNode = onGapFound ? (
        <React.Fragment key={`gap-${index}`}>{onGapFound(gapMatch[1])}</React.Fragment>
      ) : null;

      if (gapNode) {
        if (isInParagraph) {
          pChildren.push(gapNode);
          pTextAccumulator += part;
        } else {
          widgets.push(gapNode);
        }
      }
      return;
    }

    // Newline Tag
    if (part.toLowerCase().startsWith('</n')) {
      const nlNode = <div key={`nl-${index}`} className="w-full h-4" />;
      if (isInParagraph) {
        pChildren.push(nlNode);
      } else {
        widgets.push(nlNode);
      }
      return;
    }

    // Paragraph Tag (Open)
    if (part.toLowerCase().startsWith('<p')) {
      // If nested or unclosed previous P, flush it first
      if (isInParagraph) {
        flushParagraph(index - 1, currentParaStartIndex);
      }

      isInParagraph = true;
      currentParaStartIndex = index;
      const lowerPart = part.toLowerCase();
      if (lowerPart.includes('bold')) isBold = true;
      if (lowerPart.includes('center')) isCenter = true;

      const sizeMatch = part.match(/size=['"]?(\d+)['"]?/);
      if (sizeMatch) {
        fontSize = `${sizeMatch[1]}px`;
      } else {
        const legacySizeMatch = part.match(/\d+/);
        if (legacySizeMatch && !part.match(/color=['"].*?['"]/)) {
          fontSize = `${legacySizeMatch[0]}px`;
        }
      }

      // Color extraction
      const colorMatch = part.match(/color=['"](.*?)['"]/i);
      if (colorMatch) {
        const colorKey = colorMatch[1].toLowerCase();
        if (COLOR_MAP[colorKey]) {
          color = COLOR_MAP[colorKey];
        }
      }

      return;
    }

    // Paragraph Tag (Close)
    if (part.toLowerCase() === '</p>') {
      if (isInParagraph) {
        flushParagraph(index, currentParaStartIndex);
      }
      return;
    }

    // Text content
    if (!part) return;

    // Normal text
    if (isInParagraph) {
      pChildren.push(
        <span
          key={`text-${index}`}
          style={{ whiteSpace: 'pre-wrap' }}
          dangerouslySetInnerHTML={{ __html: part }}
        />,
      );
      pTextAccumulator += part;
    } else {
      // Orphan text outside P
      widgets.push(
        <span
          key={`text-${index}`}
          className="whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: part }}
        />,
      );
    }
  });

  // Flush any remaining
  if (isInParagraph) {
    flushParagraph(parts.length, currentParaStartIndex);
  }

  return <>{widgets}</>;
};

// Helper component to separate hooks logic
const ParagraphWrapper: React.FC<{
  id: string;
  className: string;
  style: React.CSSProperties;
  children: React.ReactNode;
  fullText: string;
  startIndex: number;
  parts: string[];
  onChange?: (newContent: string) => void;
  onTextClick?: (text: string) => void;
}> = ({ id, className, style, children, fullText, startIndex, parts, onChange, onTextClick }) => {
  const { registerElement, unregisterElement, setActiveElement, activeElementId } =
    useEmulatorEdit();

  useEffect(() => {
    registerElement(id, {
      onFormat: (type, _value) => {
        // Here we handle the formatting!
        if (!onChange) return;

        let tag = parts[startIndex];
        // e.g. <p bold> or <p>

        // Simple attribute toggling logic
        let newTag = tag;
        const lowerTag = tag.toLowerCase();

        switch (type) {
          case 'bold':
            if (lowerTag.includes('bold')) {
              newTag = tag
                .replace(/\s+bold/i, '')
                .replace(/bold\s+/i, '')
                .replace(/bold/i, '');
              // Clean up if it was just <p bold> -> <p > -> <p>
              if (newTag.trim() === '<p>') newTag = '<p>';
              else newTag = newTag.replace('<p ', '<p'); // minimal cleanup
            } else {
              // Add bold
              if (tag.endsWith('>')) {
                newTag = tag.slice(0, -1) + ' bold>';
              }
            }
            break;

          case 'italic':
            // Not supported by parser currently but let's add attribute
            if (lowerTag.includes('italic')) {
              newTag = tag.replace(/\s+italic/i, '');
            } else {
              newTag = tag.slice(0, -1) + ' italic>';
            }
            break;

          case 'underline':
            // Not supported by parser currently
            if (lowerTag.includes('underline')) {
              newTag = tag.replace(/\s+underline/i, '');
            } else {
              newTag = tag.slice(0, -1) + ' underline>';
            }
            break;

          case 'left':
          case 'center':
          case 'right':
            // Remove existing align
            newTag = tag.replace(/\s+(center|left|right)/gi, '');
            newTag = newTag.slice(0, -1) + ` ${type}>`;
            break;

          // Add other cases as needed
        }

        // Reconstruct
        const newParts = [...parts];
        newParts[startIndex] = newTag;
        onChange(newParts.join(''));
      },
    });

    return () => unregisterElement(id);
  }, [id, registerElement, unregisterElement, startIndex, parts, onChange]);

  const isActive = activeElementId === id;

  return (
    <span
      className={`${className} ${isActive ? 'border-primary bg-primary/5' : ''}`}
      style={style}
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        setActiveElement(id);
        onTextClick?.(fullText);
      }}
      onFocus={(e) => {
        e.stopPropagation();
        setActiveElement(id);
      }}
    >
      {children}
    </span>
  );
};
