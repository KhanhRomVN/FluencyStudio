import React from 'react';

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
}

export const RichTextParser: React.FC<RichTextParserProps> = ({ content, onGapFound }) => {
  if (!content) return null;

  // Split by tags we care about: </gap ...>, </n>, <p...>, </p>
  const parts = content.split(/((?:<\/gap id='.*?'>)|(?:<\/n\s*?>)|(?:<p.*?>)|(?:<\/p>))/gi);

  const widgets: React.ReactNode[] = [];
  let isBold = false;
  let isCenter = false;
  let fontSize: string | undefined = undefined;
  let color: string | undefined = undefined;

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

      const sizeMatch = part.match(/size=['"]?(\d+)['"]?/);
      if (sizeMatch) {
        // Adjusted regex to be safer, though simple \d+ was ok before too
        fontSize = `${sizeMatch[1]}px`;
      } else {
        // Fallback legacy non-attribute size matching
        const simpleSizeMatch = part.match(/<p\s.*?(\d+).*?>/); // Very loose, but keeping consistent if previous logic relied on just numbers floating
        // Actually the previous regex was just `part.match(/\d+/)` which is quite aggressive.
        // Let's stick to the previous simple one if it was working for the user's specific format,
        // OR standard attributes. User didn't ask to change size logic, but mentioned `color=''`.
        // I'll keep the previous simple extraction for size to avoid breaking legacy,
        // but strictly implement color.
        const legacySizeMatch = part.match(/\d+/);
        if (legacySizeMatch && !part.match(/color=['"].*?['"]/)) {
          // Avoid matching numbers inside color hex if user passed that (though user said defined colors).
          // Actually, safely we assume size is separate.
          fontSize = `${legacySizeMatch[0]}px`;
        }
      }

      // Color extraction
      const colorMatch = part.match(/color=['"](.*?)['"]/i);
      if (colorMatch) {
        const colorKey = colorMatch[1].toLowerCase(); // e.g. 'yellow red' -> invalid based on rule 'chỉ nhận 1 string'
        // User rule: "ko thể nhận 2 color trở lên". We just take the string.
        // It seems the user meant the input string in the attribute is just one color name.
        if (COLOR_MAP[colorKey]) {
          color = COLOR_MAP[colorKey];
        } else {
          // Fallback if they pass a valid hex code or unsupported name?
          // User said "ta sẽ có danh sách...".
          // But being robust doesn't hurt.
          // Let's assume strict list or valid CSS value if not in list (optional).
          // For now, strict list + return original if it looks like a color?
          // Let's stick to strict map + primary as requested, to enforce consistency.
          // But if I want to support 'black' or 'white' not in list?
          // I'll just use the map.
          color = undefined;
        }
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
      color = undefined; // Reset color
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
      color: color, // Apply color
      whiteSpace: 'pre-wrap',
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
