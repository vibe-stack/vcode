import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUp, Square } from 'lucide-react';
import { cn } from '@/utils/tailwind';

interface SimpleChatInputProps {
  onSend: (content: string) => void;
  onStop: () => void;
  isLoading: boolean;
  placeholder?: string;
  disabled?: boolean;
  isNewChat?: boolean;
}

const MODEL_OPTIONS = [
  { label: 'Grok 4', value: 'grok-4-0709' },
  { label: 'Grok 3', value: 'grok-3' },
  { label: 'Grok 3 (Fast)', value: 'grok-3-fast' },
  { label: 'Grok 3 Mini', value: 'grok-3-mini' },
  { label: 'Grok 3 Mini (Fast)', value: 'grok-3-mini-fast' },
];

export const SimpleChatInput: React.FC<SimpleChatInputProps> = ({
  onSend,
  onStop,
  isLoading,
  placeholder = "Ask me anything about your 3D scene... (Shift+Enter to send)",
  disabled = false,
  isNewChat = false,
}) => {
  const [content, setContent] = useState('');
  const [selectedModel, setSelectedModel] = useState('grok-4-0709');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isEmpty = !content.trim();

  // Load saved model selection on component mount
  useEffect(() => {
    const loadSelectedModel = async () => {
      try {
        const savedModel = await window.settingsApi.get('apps:map-builder:agent-model');
        if (savedModel && MODEL_OPTIONS.some(option => option.value === savedModel)) {
          setSelectedModel(savedModel);
        }
      } catch (error) {
        console.error('Failed to load selected model:', error);
      }
    };

    loadSelectedModel();
  }, []);

  const handleModelChange = useCallback(async (value: string) => {
    setSelectedModel(value);
    try {
      await window.settingsApi.set('apps:map-builder:agent-model', value);
    } catch (error) {
      console.error('Failed to save selected model:', error);
    }
  }, []);

  const handleSend = useCallback(() => {
    if (isEmpty || isLoading || disabled) return;

    onSend(content.trim());
    setContent('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [content, isEmpty, isLoading, disabled, onSend]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Allow normal enter behavior (new line)
        return;
      } else {
        e.preventDefault();
        handleSend();
      }
    }
  }, [handleSend]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  }, [content]);

  return (
    <div className="relative w-full">
      <div className="flex flex-col items-start w-full gap-2 p-2 border rounded-lg bg-background ">
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            className={cn(
              "w-full resize-none bg-transparent border-none outline-none",
              "text-sm placeholder:text-muted-foreground",
              "min-h-[20px] max-h-[200px]",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            rows={1}
          />
        </div>

        <div className="flex w-full items-center justify-between gap-1">
          {/* Model Selector */}
          <div className="flex-shrink-0">
            <Select value={selectedModel} onValueChange={handleModelChange} disabled={disabled || isLoading}>
              <SelectTrigger size="sm" className="w-fit min-w-[120px] h-8 text-xs background-transparent border-none">
                <SelectValue className='background-transparent' />
              </SelectTrigger>
              <SelectContent>
                {MODEL_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="text-xs">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            {isLoading ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={onStop}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                title="Stop generation"
              >
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSend}
                disabled={isEmpty || disabled}
                className={cn(
                  "h-8 w-8 p-0",
                  isEmpty || disabled
                    ? "text-muted-foreground cursor-not-allowed"
                    : "text-primary hover:text-primary/80"
                )}
                title="Send message"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
