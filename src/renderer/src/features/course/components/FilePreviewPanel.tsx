import { FileText, Upload, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect, memo, useCallback } from 'react';
import DocViewer, { DocViewerRenderers } from '@cyntler/react-doc-viewer';
import { pdfjs, Document, Page } from 'react-pdf';
import '@cyntler/react-doc-viewer/dist/index.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const PDFPreview = ({ file }: { file: File }) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageInput, setPageInput] = useState('1');

  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  // Observe which page is in view
  useEffect(() => {
    const container = containerRef.current;
    if (!container || numPages === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageNum = parseInt(entry.target.getAttribute('data-page-number') || '1', 10);
            setCurrentPage(pageNum);
            setPageInput(String(pageNum));
          }
        });
      },
      {
        root: container,
        threshold: 0.5, // 50% visibility to trigger
      },
    );

    // Observe all page elements
    Object.values(pageRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [numPages]);

  const scrollToPage = (pageNum: number) => {
    const pageEl = pageRefs.current[pageNum];
    if (pageEl) {
      pageEl.scrollIntoView({ behavior: 'smooth' });
      setCurrentPage(pageNum);
      setPageInput(String(pageNum));
    }
  };

  const handlePageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(pageInput, 10);
    if (pageNum >= 1 && pageNum <= numPages) {
      scrollToPage(pageNum);
    } else {
      setPageInput(String(currentPage));
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-background h-10 shrink-0 select-none z-10">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground mr-2">PDF Preview</span>
        </div>

        {numPages > 0 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => scrollToPage(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className="p-1 hover:bg-muted rounded disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={14} />
            </button>

            <form onSubmit={handlePageSubmit} className="flex items-center gap-1">
              <input
                type="text"
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                className="w-10 h-5 text-center text-xs border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              />
              <span className="text-xs text-muted-foreground select-none">/ {numPages}</span>
            </form>

            <button
              onClick={() => scrollToPage(Math.min(numPages, currentPage + 1))}
              disabled={currentPage >= numPages}
              className="p-1 hover:bg-muted rounded disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* PDF Document Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden w-full bg-muted/10 p-4 custom-scrollbar"
      >
        <Document
          file={file}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex items-center justify-center p-8">
              <Loader2 className="animate-spin text-muted-foreground" />
            </div>
          }
          className="flex flex-col items-center gap-4 w-full"
        >
          {Array.from(new Array(numPages), (el, index) => (
            <div
              key={`page_${index + 1}`}
              ref={(el) => (pageRefs.current[index + 1] = el)}
              data-page-number={index + 1}
              className="shadow-sm w-full flex justify-center"
            >
              <Page
                pageNumber={index + 1}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                width={undefined}
                className="max-w-full"
              />
            </div>
          ))}
        </Document>
      </div>

      {/* CSS Override for React-PDF to ensure full width responsiveness */}
      <style>{`
        .react-pdf__Page canvas {
          width: 100% !important;
          height: auto !important;
          max-width: 100%;
        }
        .react-pdf__Page {
           min-width: 200px;
        }
        
        /* Custom Scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: hsl(var(--muted-foreground) / 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: hsl(var(--muted-foreground) / 0.5);
        }
      `}</style>
    </div>
  );
};

export const FilePreviewPanel = memo(({ width }: { width?: number | string }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    inputRef.current?.click();
  };

  const isPDF = file?.type === 'application/pdf' || file?.name.toLowerCase().endsWith('.pdf');

  // Manage Object URL for DocViewer (only needed if NOT PDF)
  const [activeDoc, setActiveDoc] = useState<{ uri: string; fileName: string }[]>([]);

  useEffect(() => {
    if (file && !isPDF) {
      const objectUrl = URL.createObjectURL(file);
      setActiveDoc([{ uri: objectUrl, fileName: file.name }]);

      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    } else {
      setActiveDoc([]);
    }
  }, [file, isPDF]);

  return (
    <div
      className="border-r flex flex-col bg-background h-full transition-colors"
      style={{ width: width || '100%' }}
    >
      <div className="h-10 border-b flex items-center px-4 bg-muted/20 justify-between shrink-0">
        <span className="text-xs font-medium text-muted-foreground flex items-center gap-2">
          <FileText size={14} />
          File Preview
        </span>
        {file && (
          <button
            onClick={() => setFile(null)}
            className="text-muted-foreground hover:text-destructive"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div
        className={`flex-1 flex flex-col items-center justify-center relative overflow-hidden ${dragActive ? 'bg-primary/5' : ''} ${!file ? 'p-6' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {file ? (
          <div className="w-full h-full overflow-hidden flex flex-col relative group">
            {isPDF ? (
              <PDFPreview file={file} />
            ) : (
              <DocViewer
                key={String(width)}
                documents={activeDoc}
                pluginRenderers={DocViewerRenderers}
                style={{ height: '100%', width: '100%', background: 'transparent' }}
                config={{
                  header: {
                    disableHeader: false,
                    disableFileName: true,
                    retainURLParams: false,
                  },
                }}
              />
            )}
          </div>
        ) : (
          <>
            <div
              className={`p-4 rounded-full bg-muted/50 mb-4 transition-transform ${dragActive ? 'scale-110' : ''}`}
            >
              <Upload size={24} className="text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">Drop file or click to upload</p>
            <p className="text-xs text-muted-foreground mt-2 max-w-[200px]">
              Support for PDF, DOCX (Preview coming soon)
            </p>
            <button
              onClick={onButtonClick}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground text-xs font-medium rounded-md hover:bg-primary/90 transition-colors"
            >
              Select File
            </button>
          </>
        )}

        {/* Drag Overlay */}
        {dragActive && (
          <div className="absolute inset-0 bg-primary/10 border-2 border-primary border-dashed rounded-lg m-2 pointer-events-none flex items-center justify-center">
            <p className="text-primary font-medium">Drop file to open</p>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={handleChange}
          accept=".pdf,.docx,.txt,.md"
        />
      </div>
    </div>
  );
});
