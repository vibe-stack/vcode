import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/utils/tailwind';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './agent-markdown-content.css';

interface AgentMarkdownRendererProps {
    content: string;
}

// Custom code block component with copy functionality
const AgentCodeBlock = ({ children, className, ...props }: any) => {
    const [copied, setCopied] = useState(false);
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';
    
    const handleCopy = async () => {
        const codeContent = typeof children === 'string' ? children : String(children);
        try {
            await navigator.clipboard.writeText(codeContent.trim());
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy code:', err);
        }
    };

    const codeContent = typeof children === 'string' ? children : String(children);

    return (
        <div className="relative group my-3 w-full max-w-full rounded-md border border-border overflow-hidden">
            <div className="flex items-center justify-between bg-muted/30 px-3 py-1.5 border-b border-border">
                <span className="text-xs text-muted-foreground font-mono capitalize">
                    {language || 'text'}
                </span>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={handleCopy}
                    title="Copy code"
                >
                    {copied ? (
                        <Check className="h-2.5 w-2.5 text-green-500" />
                    ) : (
                        <Copy className="h-2.5 w-2.5" />
                    )}
                </Button>
            </div>
            <div className="overflow-x-auto">
                <pre className="p-3 text-xs bg-muted/10 m-0 font-mono leading-relaxed whitespace-pre">
                    <code className={cn("block", className)} {...props}>
                        {codeContent}
                    </code>
                </pre>
            </div>
        </div>
    );
};

// Markdown components optimized for agent messages
const agentMarkdownComponents = {
    code: ({ node, inline, className, children, ...props }: any) => {
        if (inline) {
            return (
                <code
                    className="bg-muted/50 text-foreground px-1 py-0.5 rounded text-xs font-mono"
                    {...props}
                >
                    {children}
                </code>
            );
        }
        return (
            <AgentCodeBlock className={className} {...props}>
                {children}
            </AgentCodeBlock>
        );
    },
    pre: ({ children }: any) => children,
    p: ({ children, ...props }: any) => (
        <div className="mb-2 block last:mb-0 text-sm leading-relaxed" {...props}>
            {children}
        </div>
    ),
    h1: ({ children }: any) => (
        <h1 className="text-base font-semibold mb-2 text-foreground border-b border-border pb-1">
            {children}
        </h1>
    ),
    h2: ({ children }: any) => (
        <h2 className="text-sm font-semibold mb-1.5 text-foreground">
            {children}
        </h2>
    ),
    h3: ({ children }: any) => (
        <h3 className="text-sm font-medium mb-1 text-foreground">
            {children}
        </h3>
    ),
    ul: ({ children }: any) => (
        <ul className="list-disc list-inside mb-2 space-y-0.5 text-sm">
            {children}
        </ul>
    ),
    ol: ({ children }: any) => (
        <ol className="list-decimal list-inside mb-2 space-y-0.5 text-sm">
            {children}
        </ol>
    ),
    li: ({ children }: any) => (
        <li className="text-sm leading-relaxed">
            {children}
        </li>
    ),
    blockquote: ({ children }: any) => (
        <blockquote className="border-l-2 border-border pl-3 my-2 text-sm italic text-muted-foreground">
            {children}
        </blockquote>
    ),
    a: ({ href, children }: any) => (
        <a
            href={href}
            className="text-primary hover:text-primary/80 underline underline-offset-2 text-sm"
            target="_blank"
            rel="noopener noreferrer"
        >
            {children}
        </a>
    ),
    table: ({ children }: any) => (
        <div className="overflow-x-auto my-2">
            <table className="min-w-full border border-border rounded text-xs">
                {children}
            </table>
        </div>
    ),
    thead: ({ children }: any) => (
        <thead className="bg-muted/30">
            {children}
        </thead>
    ),
    tbody: ({ children }: any) => (
        <tbody>
            {children}
        </tbody>
    ),
    tr: ({ children }: any) => (
        <tr className="border-b border-border">
            {children}
        </tr>
    ),
    th: ({ children }: any) => (
        <th className="px-2 py-1.5 text-left font-medium text-foreground">
            {children}
        </th>
    ),
    td: ({ children }: any) => (
        <td className="px-2 py-1.5 text-foreground">
            {children}
        </td>
    ),
    hr: () => (
        <hr className="my-3 border-border" />
    ),
    strong: ({ children }: any) => (
        <strong className="font-semibold text-foreground">
            {children}
        </strong>
    ),
    em: ({ children }: any) => (
        <em className="italic text-foreground">
            {children}
        </em>
    )
};

export function AgentMarkdownRenderer({ content }: AgentMarkdownRendererProps) {
    if (!content || content.trim() === '') {
        return <div className="text-xs text-muted-foreground italic">No content</div>;
    }

    return (
        <div className="agent-markdown-content max-w-full min-w-0 overflow-hidden">
            <Markdown 
                remarkPlugins={[remarkGfm]}
                components={agentMarkdownComponents}
            >
                {content}
            </Markdown>
        </div>
    );
}
