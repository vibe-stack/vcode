import React, { useMemo } from 'react';
import { BufferContent } from '@/stores/buffers';

export interface ContentViewerProps {
  /** The buffer to display */
  buffer: BufferContent;
  /** Whether this viewer is focused/active */
  isFocused?: boolean;
  /** Called when viewer gains focus */
  onFocus?: () => void;
}

/**
 * Content viewer for non-code files like images, PDFs, etc.
 */
export function ContentViewer({ buffer, isFocused = false, onFocus }: ContentViewerProps) {
  // Determine content type and how to display it
  const contentDisplay = useMemo(() => {
    if (buffer.isLoading) {
      return (
        <div className="h-full flex items-center justify-center bg-background">
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      );
    }

    if (buffer.error) {
      return (
        <div className="h-full flex items-center justify-center bg-background">
          <div className="text-center">
            <p className="text-destructive text-sm mb-2">Error loading file</p>
            <p className="text-xs text-muted-foreground">{buffer.error}</p>
          </div>
        </div>
      );
    }

    // Handle different content types
    switch (buffer.type) {
      case 'image':
        return <ImageViewer buffer={buffer} onFocus={onFocus} />;
      
      case 'pdf':
        return <PDFViewer buffer={buffer} onFocus={onFocus} />;
      
      case 'video':
        return <VideoViewer buffer={buffer} onFocus={onFocus} />;
      
      case 'audio':
        return <AudioViewer buffer={buffer} onFocus={onFocus} />;
      
      default:
        return <BinaryViewer buffer={buffer} onFocus={onFocus} />;
    }
  }, [buffer, onFocus]);

  return (
    <div 
      className="h-full w-full"
      onClick={() => onFocus?.()}
      tabIndex={0}
      onFocus={() => onFocus?.()}
    >
      {contentDisplay}
    </div>
  );
}

function ImageViewer({ buffer, onFocus }: { buffer: BufferContent; onFocus?: () => void }) {
  const imageUrl = useMemo(() => {
    if (buffer.content && buffer.content instanceof Uint8Array) {
      const blob = new Blob([buffer.content], { type: buffer.mimeType || 'image/*' });
      return URL.createObjectURL(blob);
    }
    return null;
  }, [buffer.content, buffer.mimeType]);

  if (!imageUrl) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm">Unable to display image</p>
      </div>
    );
  }

  return (
    <div className="h-full flex items-center justify-center bg-background p-4">
      <div className="max-w-full max-h-full overflow-auto">
        <img
          src={imageUrl}
          alt={buffer.name}
          className="max-w-full max-h-full object-contain"
          onLoad={() => {
            // Clean up URL after image loads
            return () => URL.revokeObjectURL(imageUrl);
          }}
          onClick={() => onFocus?.()}
        />
      </div>
      <div className="absolute bottom-4 left-4 bg-black/50 text-white px-2 py-1 rounded text-xs">
        {buffer.name} • {buffer.fileSize ? `${Math.round(buffer.fileSize / 1024)}KB` : 'Unknown size'}
      </div>
    </div>
  );
}

function PDFViewer({ buffer, onFocus }: { buffer: BufferContent; onFocus?: () => void }) {
  const pdfUrl = useMemo(() => {
    if (buffer.content && buffer.content instanceof Uint8Array) {
      const blob = new Blob([buffer.content], { type: 'application/pdf' });
      return URL.createObjectURL(blob);
    }
    return null;
  }, [buffer.content]);

  if (!pdfUrl) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm">Unable to display PDF</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full" onClick={() => onFocus?.()}>
      <iframe
        src={pdfUrl}
        className="w-full h-full border-0"
        title={buffer.name}
      />
    </div>
  );
}

function VideoViewer({ buffer, onFocus }: { buffer: BufferContent; onFocus?: () => void }) {
  const videoUrl = useMemo(() => {
    if (buffer.content && buffer.content instanceof Uint8Array) {
      const blob = new Blob([buffer.content], { type: buffer.mimeType || 'video/*' });
      return URL.createObjectURL(blob);
    }
    return null;
  }, [buffer.content, buffer.mimeType]);

  if (!videoUrl) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm">Unable to display video</p>
      </div>
    );
  }

  return (
    <div className="h-full flex items-center justify-center bg-background p-4" onClick={() => onFocus?.()}>
      <video
        src={videoUrl}
        controls
        className="max-w-full max-h-full"
        onLoadedData={() => {
          return () => URL.revokeObjectURL(videoUrl);
        }}
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
}

function AudioViewer({ buffer, onFocus }: { buffer: BufferContent; onFocus?: () => void }) {
  const audioUrl = useMemo(() => {
    if (buffer.content && buffer.content instanceof Uint8Array) {
      const blob = new Blob([buffer.content], { type: buffer.mimeType || 'audio/*' });
      return URL.createObjectURL(blob);
    }
    return null;
  }, [buffer.content, buffer.mimeType]);

  if (!audioUrl) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm">Unable to play audio</p>
      </div>
    );
  }

  return (
    <div className="h-full flex items-center justify-center bg-background p-4" onClick={() => onFocus?.()}>
      <div className="text-center">
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2">{buffer.name}</h3>
          <p className="text-sm text-muted-foreground">
            {buffer.fileSize ? `${Math.round(buffer.fileSize / 1024)}KB` : 'Unknown size'}
          </p>
        </div>
        <audio
          src={audioUrl}
          controls
          className="w-full max-w-md"
          onLoadedData={() => {
            return () => URL.revokeObjectURL(audioUrl);
          }}
        >
          Your browser does not support the audio tag.
        </audio>
      </div>
    </div>
  );
}

function BinaryViewer({ buffer, onFocus }: { buffer: BufferContent; onFocus?: () => void }) {
  const fileInfo = useMemo(() => {
    const size = buffer.fileSize ? `${Math.round(buffer.fileSize / 1024)}KB` : 'Unknown size';
    const mimeType = buffer.mimeType || 'Unknown type';
    
    return { size, mimeType };
  }, [buffer.fileSize, buffer.mimeType]);

  return (
    <div className="h-full flex items-center justify-center bg-background" onClick={() => onFocus?.()}>
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-lg flex items-center justify-center">
          <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium mb-2">{buffer.name}</h3>
        <p className="text-sm text-muted-foreground mb-1">{fileInfo.mimeType}</p>
        <p className="text-sm text-muted-foreground">{fileInfo.size}</p>
        <p className="text-xs text-muted-foreground mt-4">
          Binary file cannot be edited in text editor
        </p>
      </div>
    </div>
  );
}
