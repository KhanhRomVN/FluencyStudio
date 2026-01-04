import React, { useState, useEffect } from 'react';
import { X, Play, Save, FolderOpen } from 'lucide-react';
import { CodeBlock } from '../../../components/CodeBlock';
import { folderService } from '../../../shared/services/folderService';

interface TranscriptDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Segment {
  speaker: string;
  start: string;
  end: string;
  text: string;
}

interface TranscriptJson {
  language_code: string;
  segments: Segment[];
}

export const TranscriptDrawer: React.FC<TranscriptDrawerProps> = ({ isOpen, onClose }) => {
  const [rawText, setRawText] = useState<string>('');
  const [jsonOutput, setJsonOutput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Sample raw text for initial state or placeholder
  useEffect(() => {
    if (isOpen && !rawText) {
      setRawText(`Speaker 1
(00:00) Example text here...
Speaker 2
(00:10) Another speaker...`);
    }
  }, [isOpen]);

  const processTranscript = () => {
    setIsProcessing(true);
    try {
      const lines = rawText.split('\n');
      const segments: Segment[] = [];
      let currentSpeaker = '';

      // Temporary storage for current segment being built
      let currentStart = '';
      let currentTextParts: string[] = [];

      // Helper to push segment
      const pushSegment = (endTime: string) => {
        if (currentStart) {
          segments.push({
            speaker: currentSpeaker || 'Unknown',
            start: currentStart,
            end: endTime,
            text: currentTextParts.join(' ').trim(),
          });
        }
      };

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Check for Speaker line (simple heuristic: starts with "Speaker")
        // Or if it's just a name line (no parens, short?) - specific to user example "Speaker 1"
        if (line.toLowerCase().startsWith('speaker')) {
          currentSpeaker = line;
          continue;
        }

        // Check for Timestamp line: (MM:SS) Text...
        const timeMatch = line.match(/^\((\d{2}:\d{2})\)\s*(.*)/);
        if (timeMatch) {
          // Found new timestamp, meaning previous segment ends here.
          // But wait, user example has Speaker line BEFORE timestamp line.
          // "Speaker 1 \n (00:00) ..."
          // So if we have a pending segment, we close it with this new time.
          const newTime = timeMatch[1];
          const textContent = timeMatch[2];

          if (currentStart) {
            pushSegment(newTime);
          }

          // Start new segment
          currentStart = newTime;
          currentTextParts = [textContent];
        } else {
          // Continuation text?
          if (currentStart) {
            currentTextParts.push(line);
          }
        }
      }

      // Handle the very last segment
      // Default duration 10s? or just use start time + something.
      // Or if user wants empty end?
      // User example logic: "end": "02:11" -> next is 02:11.
      // For last one: "start": "02:11", "end": "02:21" (looks like +10s or arbitrary)
      if (currentStart) {
        // Try to add some default duration or leave it same as start?
        // Let's add 10 seconds for the last one logic
        let [mins, secs] = currentStart.split(':').map(Number);
        let date = new Date(0, 0, 0, 0, mins, secs + 10);
        let endStr = `${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;

        pushSegment(endStr);
      }

      const result: TranscriptJson = {
        language_code: 'eng', // Default
        segments,
      };

      setJsonOutput(JSON.stringify(result, null, 2));
    } catch (e) {
      console.error('Processing error', e);
      setJsonOutput(JSON.stringify({ error: 'Failed to process text' }, null, 2));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = async () => {
    try {
      // 1. Select folder
      const result = await folderService.selectCourseFolder();
      if (result.canceled || result.filePaths.length === 0) return;

      const folderPath = result.filePaths[0];
      const filePath = `${folderPath}/transcript.json`; // path separator handling? folderService usually returns standardized paths hopefully.

      // 2. Write file
      const saveResult = await folderService.saveFile(filePath, jsonOutput);

      if (saveResult.success) {
        alert('Saved successfully to ' + filePath);
      } else {
        alert('Failed to save: ' + saveResult.error);
      }
    } catch (e) {
      console.error(e);
      alert('Export failed');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col animate-in slide-in-from-bottom-10 duration-200">
      {/* Header */}
      <div className="h-14 border-b flex items-center justify-between px-4 bg-card shadow-sm">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <FolderOpen size={20} className="text-primary" />
          Transcript Processor
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={processTranscript}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-sm text-sm font-medium transition-colors"
          >
            <Play size={16} />
            Process
          </button>
          <div className="w-px h-6 bg-border mx-1" />
          <button
            onClick={handleExport}
            disabled={!jsonOutput}
            className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-600 hover:bg-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-sm text-sm font-medium transition-colors"
          >
            <Save size={16} />
            Export JSON
          </button>
          <div className="w-px h-6 bg-border mx-1" />
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Raw Input */}
        <div className="flex-1 flex flex-col border-r min-w-0">
          <div className="h-8 bg-muted/30 border-b flex items-center px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Raw Text Input
          </div>
          <div className="flex-1 relative">
            <CodeBlock
              code={rawText}
              language="plaintext"
              onChange={(val) => setRawText(val)}
              readOnly={false}
            />{' '}
          </div>
        </div>

        {/* Right: Processed Output */}
        <div className="flex-1 flex flex-col min-w-0 bg-muted/5">
          <div className="h-8 bg-muted/30 border-b flex items-center px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Process Output (JSON)
          </div>
          <div className="flex-1 relative">
            <CodeBlock
              code={jsonOutput}
              language="json"
              onChange={(val) => setJsonOutput(val)}
              readOnly={false}
            />{' '}
          </div>
        </div>
      </div>
    </div>
  );
};
