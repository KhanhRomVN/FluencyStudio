import React, { useState, useEffect } from 'react';
import { X, CircleDotDashed } from 'lucide-react';
import { folderService } from '../../../../../../../shared/services/folderService';

interface TutorialDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  content: string;
  parentFilePath?: string;
}

export const TutorialDrawer: React.FC<TutorialDrawerProps> = ({
  isOpen,
  onClose,
  title,
  content,
  parentFilePath,
}) => {
  const [parsedContent, setParsedContent] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Helper function to parse content and identify image paths
  const parseContent = (contentStr: string): { html: string; imagePaths: string[] } => {
    if (!contentStr) return { html: '', imagePaths: [] };

    let result = contentStr;
    const imagePaths: string[] = [];

    // Replace </n> tags with <br/> for proper line breaks
    result = result.replace(/<\/n\s*>/gi, '<br/>');

    // Convert custom <p style='...'> tags to proper HTML with inline styles
    result = result.replace(
      /<p\s+style='([^']*)'\>\s*|<p\s+style="([^"]*)"\s*>/gi,
      (match, styleAttr1, styleAttr2) => {
        const styleAttr = styleAttr1 || styleAttr2 || '';
        const styles: string[] = [];
        const lowerStyle = styleAttr.toLowerCase();

        if (lowerStyle.includes('italic')) {
          styles.push('font-style: italic');
        }
        if (lowerStyle.includes('bold')) {
          styles.push('font-weight: bold');
        }
        if (lowerStyle.includes('center')) {
          styles.push('text-align: center; display: block');
        }

        // Check for font size (number in the style)
        const fontSizeMatch = styleAttr.match(/(\d+)/);
        if (fontSizeMatch) {
          styles.push(`font-size: ${fontSizeMatch[1]}px`);
        }

        if (styles.length > 0) {
          return `<span style="${styles.join('; ')}">`;
        }
        return '<span>';
      },
    );

    // Replace closing </p> tags with </span>
    result = result.replace(/<\/p>/gi, '</span>');

    // Also handle simple <p> tags without style
    result = result.replace(/<p>/gi, '<span>');

    // Fix malformed image syntax: </image src='...'> or </img src='...'> to <img src='...'>
    result = result.replace(
      /<\/\s*(image|img)\s+src=(['"])([^'"]+)\2\s*>/gi,
      (match, tag, quote, path) => {
        return `<img src=${quote}${path}${quote} data-original-path=${quote}${path}${quote} />`;
      },
    );

    // Also handle correct image syntax in case it exists
    result = result.replace(
      /<image\s+src=(['"])([^'"]+)\1\s*\/?>/gi,
      '<img src=$1$2$1 data-original-path=$1$2$1 />',
    );

    // Collect relative image paths and mark them for replacement
    if (parentFilePath) {
      const dir = parentFilePath.substring(0, parentFilePath.lastIndexOf('/'));

      // Find all images with relative paths and collect them
      const imgRegex = /<img\s+src=(['"])\.\/([^'"]+)\1([^>]*)>/gi;
      let match;
      while ((match = imgRegex.exec(result)) !== null) {
        const relativePath = match[2];
        const absolutePath = `${dir}/${relativePath}`;
        imagePaths.push(absolutePath);
      }

      // Replace relative paths with placeholder that will be updated after loading
      result = result.replace(/<img\s+src=(['"])\.\/([^'"]+)\1/gi, (match, quote, relativePath) => {
        const absolutePath = `${dir}/${relativePath}`;
        return `<img src=${quote}loading:${absolutePath}${quote} data-path=${quote}${absolutePath}${quote}`;
      });
    }

    return { html: result, imagePaths };
  };

  // Load images when content or parentFilePath changes
  useEffect(() => {
    const loadImages = async () => {
      setLoading(true);
      const { html, imagePaths } = parseContent(content);

      if (imagePaths.length === 0) {
        setParsedContent(html);
        setLoading(false);
        return;
      }

      // Load all images concurrently
      const imagePromises = imagePaths.map(async (path) => {
        const dataUrl = await folderService.loadImageFile(path);
        return { path, dataUrl };
      });

      const loadedImages = await Promise.all(imagePromises);

      // Replace placeholders with actual data URLs
      let finalHtml = html;
      loadedImages.forEach(({ path, dataUrl }) => {
        if (dataUrl) {
          const regex = new RegExp(
            `src=(['"])loading:${path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\1`,
            'gi',
          );
          finalHtml = finalHtml.replace(regex, `src=$1${dataUrl}$1`);
        }
      });

      setParsedContent(finalHtml);
      setLoading(false);
    };

    loadImages();
  }, [content, parentFilePath]);

  return (
    <>
      <div
        className={`absolute inset-0 bg-black/50 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <div
        className={`absolute bottom-0 left-0 right-0 h-[75%] bg-[hsl(var(--background))] rounded-t-3xl z-50 transition-transform duration-300 ease-out flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.2)] ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="h-1.5 w-12 bg-gray-300/50 rounded-full mx-auto mt-3 mb-2 flex-shrink-0" />
        <div className="px-6 py-2 border-b border-[hsl(var(--border))]/50 flex justify-between items-center bg-[hsl(var(--background))]">
          <div className="flex items-center gap-2">
            <CircleDotDashed size={20} className="text-[hsl(var(--primary))]" />
            <h3 className="font-bold text-lg">Tutorial</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-[hsl(var(--muted))]">
            <X size={20} className="text-[hsl(var(--muted-foreground))]" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 text-[hsl(var(--foreground))] space-y-6 [&::-webkit-scrollbar]:hidden">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-[hsl(var(--muted-foreground))]">
              Loading content...
            </div>
          ) : (
            <>
              {title && (
                <h4 className="text-xl font-bold text-[hsl(var(--foreground))] mb-4 border-b pb-2 border-[hsl(var(--border))]/50">
                  {title}
                </h4>
              )}
              <div
                className="prose prose-base dark:prose-invert leading-relaxed max-w-none [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:shadow-lg [&_img]:my-4"
                dangerouslySetInnerHTML={{ __html: parsedContent }}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
};
