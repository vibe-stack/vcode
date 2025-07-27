import React, { useState } from 'react';
import { Brain } from 'lucide-react';

interface ReasoningDisplayProps {
    reasoning: string;
    details?: Array<{ type: string; text?: string }>;
}

export function ReasoningDisplay({ reasoning, details }: ReasoningDisplayProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    console.log("got reasoning:", reasoning, "with details:", details);

    // If we have details, process them; otherwise use the reasoning string
    const reasoningText = details 
        ? details.map(detail => detail.type === 'text' ? detail.text : '<redacted>').join('')
        : reasoning;

    if (!reasoningText || reasoningText.trim() === '') {
        return null;
    }

    return (
        <div className="space-y-2">
            <div 
                className="flex items-center gap-2 py-1 px-2 rounded opacity-70 text-xs cursor-pointer hover:opacity-90 hover:bg-muted/30 transition-all"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <Brain className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">
                    Show Reasoning
                </span>
                <span className="text-muted-foreground text-xs ml-auto">
                    {isExpanded ? 'Click to collapse' : 'Click for details'}
                </span>
            </div>
            
            {isExpanded && (
                <div className="ml-6">
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed overflow-x-auto bg-muted/20 p-3 rounded">
                        {reasoningText}
                    </pre>
                </div>
            )}
        </div>
    );
}
