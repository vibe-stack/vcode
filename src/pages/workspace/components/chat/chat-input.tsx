import React, { useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send, ArrowUp, Square } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onSend: () => void;
  onStop: () => void;
  isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onKeyPress,
  onSend,
  onStop,
  isLoading,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  return (
    <div className="relative w-full">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={onChange}
        onKeyPress={onKeyPress}
        placeholder="Ask me anything about your project..."
        className="flex-1 resize-none min-h-0 h-20 !text-xs pr-10"
        disabled={isLoading}
      />
      <div className="absolute bottom-2 right-2 flex items-end">
        {isLoading ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onStop}
            tabIndex={-1}
            aria-label="Stop"
          >
            <Square className="h-4 w-4 text-red-500" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onSend}
            disabled={!value.trim()}
            tabIndex={-1}
            aria-label="Send"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
