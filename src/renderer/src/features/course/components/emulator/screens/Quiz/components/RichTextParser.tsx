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
  sectionId?: string;
  onGapFound?: (id: string) => React.ReactNode;
  onTextClick?: (text: string) => void;
  onHintClick?: (hint: string) => void;
  onChange?: (newContent: string) => void;
}

export const RichTextParser: React.FC<RichTextParserProps> = ({
  content,
  sectionId,
  onGapFound,
  onTextClick,
  onHintClick,
  onChange,
}) => {
  if (!content) return null;

  // Split by tags we care about: </gap ...>, </n>, <p...>, </p>
  // Improved regex to handle attributes containing ">" (like hints with HTML)
  const parts = content.split(
    /((?:<\/gap id='.*?'>)|(?:<\/n\s*?>)|(?:<p(?:\s+(?:[^>"']|"[^"]*"|'[^']*')*)*>)|(?:<\/p>))/gi,
  );

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
  let hint: string | undefined = undefined;
  let importance: 'low' | 'medium' | 'high' | undefined = undefined;

  const flushParagraph = (closeIndex: number, startIndex: number) => {
    if (pChildren.length > 0) {
      const fullText = pTextAccumulator; // Capture current value
      const uniqueId = `${sectionId ? sectionId + '-' : ''}p-${startIndex}-${closeIndex}`;

      // Construct full outer HTML for precise highlighting
      // parts[startIndex] is the opening tag
      // parts[closeIndex] is usually the closing tag if accessible, or we check if it is </p>
      let closingTag = '';
      if (closeIndex < parts.length && parts[closeIndex].toLowerCase() === '</p>') {
        closingTag = parts[closeIndex];
      }
      const fullOuterHTML = `${parts[startIndex]}${fullText}${closingTag}`;

      const wrapperStyle: React.CSSProperties = {
        fontSize,
        color, // Apply color to wrapper so it inherits
        fontWeight: isBold ? 'bold' : 'normal',
      };

      let borderColorClass = 'border-transparent';
      if (hint) {
        switch (importance) {
          case 'low':
            borderColorClass = 'border-green-500';
            break;
          case 'medium':
            borderColorClass = 'border-orange-500';
            break;
          case 'high':
            borderColorClass = 'border-red-500';
            break;
          default:
            borderColorClass = 'border-primary';
            break;
        }
      }

      const wrapperClass = `
        relative ${isCenter ? 'block w-full text-center' : 'inline'} rounded-md
        ${hint ? `border border-dashed ${borderColorClass} cursor-pointer hover:bg-primary/5` : 'border border-dashed border-transparent'}
        transition-all duration-200
        px-1 -mx-1
      `.trim();

      widgets.push(
        <ParagraphWrapper
          key={uniqueId}
          id={uniqueId}
          className={wrapperClass}
          style={wrapperStyle}
          fullText={fullText}
          fullOuterHTML={fullOuterHTML}
          startIndex={startIndex}
          parts={parts}
          currentTag={parts[startIndex]}
          onChange={onChange}
          onTextClick={onTextClick}
          onHintClick={onHintClick}
          hint={hint}
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
    hint = undefined;
    importance = undefined;
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
        // Avoid legacy size matching if color or hint attributes are present, as distinct numbers like "Task 1" in hint could trigger it
        if (
          legacySizeMatch &&
          !part.match(/color=['"].*?['"]/) &&
          !part.match(/hint=['"].*?['"]/)
        ) {
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

      // Hint extraction - handles nested quotes/HTML
      // Fixed: Avoid backreference in character class by using alternation for ' and "
      const hintMatch = part.match(/hint=(?:'((?:[^']|\\')*?)'|"((?:[^"]|\\")*?)")/i);
      if (hintMatch) {
        hint = hintMatch[1] || hintMatch[2]; // Group 1 for single quotes, Group 2 for double quotes
      }

      // Importance extraction
      const importanceMatch = part.match(/importance=['"](low|medium|high)['"]/i);
      if (importanceMatch) {
        importance = importanceMatch[1] as 'low' | 'medium' | 'high';
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
  fullOuterHTML: string; // New prop
  startIndex: number;
  parts: string[];
  currentTag: string; // New prop
  onChange?: (newContent: string) => void;
  onTextClick?: (text: string) => void;
  onHintClick?: (hint: string) => void;
  hint?: string;
}> = ({
  id,
  className,
  style,
  children,
  fullText,
  fullOuterHTML,
  startIndex,
  parts,
  currentTag,
  onChange,
  onTextClick,
  onHintClick,
  hint,
}) => {
  const {
    registerElement,
    unregisterElement,
    setActiveElement,
    activeElementId,
    updateActiveFormats,
    applyFormat,
    setActiveContent,
  } = useEmulatorEdit();

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
              newTag = tag
                .replace(/\s+italic/i, '')
                .replace(/italic\s+/i, '')
                .replace(/italic/i, '');

              if (newTag.trim() === '<p>') newTag = '<p>';
              else newTag = newTag.replace('<p ', '<p');
            } else {
              newTag = tag.slice(0, -1) + ' italic>';
            }
            break;

          case 'underline':
            // Not supported by parser currently
            if (lowerTag.includes('underline')) {
              newTag = tag
                .replace(/\s+underline/i, '')
                .replace(/underline\s+/i, '')
                .replace(/underline/i, '');

              if (newTag.trim() === '<p>') newTag = '<p>';
              else newTag = newTag.replace('<p ', '<p');
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

          case 'color':
            // Handle color
            if (lowerTag.match(/color=['"].*?['"]/)) {
              // Replace
              if (_value) {
                newTag = tag.replace(/color=['"].*?['"]/i, `color='${_value}'`);
              } else {
                // Remove
                newTag = tag.replace(/\s*color=['"].*?['"]/i, '');
              }
            } else {
              // Add
              if (_value) {
                newTag = tag.slice(0, -1) + ` color='${_value}'>`;
              }
            }
            break;

          case 'size':
            // Handle size
            // _value is like '16px'
            let sizeVal = _value ? _value.replace('px', '') : '';
            if (lowerTag.match(/size=['"]?(\d+)['"]?/)) {
              // Replace explicit size attr
              newTag = tag.replace(/size=['"]?(\d+)['"]?/i, `size='${sizeVal}'`);
            } else if (lowerTag.match(/\d+/)) {
              // Replace legacy size if found
              const m = tag.match(/\d+/);
              if (m && !tag.match(/color/)) {
                newTag = tag.replace(m[0], sizeVal);
              } else {
                newTag = tag.slice(0, -1) + ` size='${sizeVal}'>`;
              }
            } else {
              newTag = tag.slice(0, -1) + ` size='${sizeVal}'>`;
            }
            break;
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

  // Sync active formats when active or content changes
  useEffect(() => {
    if (isActive && currentTag) {
      // Parse properties from tag
      const tag = currentTag;
      const lowerTag = tag.toLowerCase();

      // Defaults
      let isBold = lowerTag.includes('bold');
      let isItalic = lowerTag.includes('italic');
      let isUnderline = lowerTag.includes('underline');
      let align: 'left' | 'center' | 'right' = 'left';
      let fontSize: string | undefined;
      let color: string | undefined;

      // check for style attribute content for more precise parsing
      const styleMatch = tag.match(/style=['"](.*?)['"]/i);
      if (styleMatch) {
        const styleContent = styleMatch[1].toLowerCase();
        // Check keywords in style
        if (styleContent.includes('center')) align = 'center';
        else if (styleContent.includes('right')) align = 'right';

        // Check for loose number in style (legacy size format like 'bold center 18')
        const styleNumber = styleContent.match(/\b\d+\b/);
        if (styleNumber) {
          fontSize = styleNumber[0];
        }
      }

      // Overrides/Fallbacks if not found in style (or if style didn't cover it)
      // Alignment fallback
      if (align === 'left') {
        if (lowerTag.includes('center') && !lowerTag.includes('style='))
          align = 'center'; // minimal safety check
        else if (lowerTag.includes('align="center"') || lowerTag.includes("align='center'"))
          align = 'center';
        else if (lowerTag.includes('right') && !lowerTag.includes('style=')) align = 'right';
        else if (lowerTag.includes('align="right"') || lowerTag.includes("align='right'"))
          align = 'right';
      }

      // Font size fallback (explicit size attribute)
      const sizeAttr = tag.match(/size=['"]?(\d+)['"]?/i);
      if (sizeAttr) {
        fontSize = sizeAttr[1];
      } else if (!fontSize) {
        // Legacy fallback: look for number in entire tag if not in style
        // But careful not to match color or other attributes
        // Only if we didn't find it in style
        const legacyMatch = tag.match(/\b\d+\b/);
        if (legacyMatch && !tag.match(/color=['"].*?['"]/i) && !tag.match(/id=['"].*?['"]/i)) {
          fontSize = legacyMatch[0];
        }
      }

      // Color extraction
      const colorMatch = tag.match(/color=['"](.*?)['"]/i);
      if (colorMatch) color = colorMatch[1];

      updateActiveFormats({
        isBold,
        isItalic,
        isUnderline,
        align,
        color,
        fontSize,
      });
    }
  }, [isActive, currentTag, updateActiveFormats]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          applyFormat('bold');
          break;
        case 'i':
          e.preventDefault();
          applyFormat('italic');
          break;
        case 'u':
          e.preventDefault();
          applyFormat('underline');
          break;
      }
    }
  };

  return (
    <span
      className={`${className} ${isActive ? 'border-primary bg-primary/5' : ''}`}
      style={style}
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        if (hint && onHintClick) {
          onHintClick(hint);
          return;
        }
        setActiveElement(id);
        setActiveContent(fullOuterHTML);
        onTextClick?.(fullText);
      }}
      onKeyDown={handleKeyDown}
      onFocus={(e) => {
        e.stopPropagation();
        setActiveElement(id);
        setActiveContent(fullOuterHTML);
      }}
    >
      {children}
    </span>
  );
};
