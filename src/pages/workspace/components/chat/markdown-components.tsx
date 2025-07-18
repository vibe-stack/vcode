import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { cn } from "@/utils/tailwind";
import type { Components } from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
// Removed react-diff-viewer-continued due to React 19 compatibility issues

const CodeBlock = ({ children, className, ...props }: any) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "";

  const handleCopy = async () => {
    const codeContent =
      typeof children === "string" ? children : String(children);
    try {
      await navigator.clipboard.writeText(codeContent.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  const codeContent =
    typeof children === "string" ? children : String(children);

  // Check if this is a diff block
  const isDiff = language === "diff";

  if (isDiff) {
    // Parse diff content for the diff viewer
    const lines = codeContent.trim().split("\n");
    let oldCode = "";
    let newCode = "";
    let inOld = false;
    let inNew = false;

    lines.forEach((line) => {
      if (line.startsWith("---")) {
        inOld = true;
        inNew = false;
      } else if (line.startsWith("+++")) {
        inOld = false;
        inNew = true;
      } else if (line.startsWith("-") && !line.startsWith("---")) {
        oldCode += line.substring(1) + "\n";
      } else if (line.startsWith("+") && !line.startsWith("+++")) {
        newCode += line.substring(1) + "\n";
      } else if (!line.startsWith("@")) {
        // Context lines (no prefix)
        const content = line.startsWith(" ") ? line.substring(1) : line;
        oldCode += content + "\n";
        newCode += content + "\n";
      }
    });

    return (
      <div className="group border-border relative my-4 w-full max-w-full overflow-hidden rounded-lg border">
        <div className="bg-muted/50 border-border flex items-center justify-between border-b px-4 py-2">
          <span className="text-muted-foreground font-mono text-xs capitalize">
            Diff View
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={handleCopy}
            title="Copy diff"
          >
            {copied ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        </div>
        <div className="overflow-x-auto">
          <SyntaxHighlighter
            language="diff"
            style={oneDark}
            customStyle={{
              margin: 0,
              background: "oklch(0.18 0.015 240)",
              fontSize: "0.875rem",
              lineHeight: "1.25rem",
            }}
            wrapLines={true}
            wrapLongLines={true}
            showLineNumbers={true}
            lineNumberStyle={{
              color: "oklch(0.5 0.015 240)",
              fontSize: "0.75rem",
              paddingRight: "1rem",
            }}
          >
            {codeContent.trim()}
          </SyntaxHighlighter>
        </div>
      </div>
    );
  }

  return (
    <div className="group border-border relative my-4 w-full max-w-full overflow-hidden rounded-lg border">
      <div className="bg-muted/50 border-border flex items-center justify-between border-b px-4 py-2">
        <span className="text-muted-foreground font-mono text-xs capitalize">
          {language || "text"}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={handleCopy}
          title="Copy code"
        >
          {copied ? (
            <Check className="h-3 w-3 text-green-500" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      </div>
      <div className="overflow-x-auto">
        {language ? (
          <SyntaxHighlighter
            language={language}
            style={oneDark}
            customStyle={{
              margin: 0,
              padding: "1rem",
              backgroundColor: "oklch(0.16 0.015 240)",
              fontSize: "0.875rem",
              lineHeight: "1.5",
            }}
            codeTagProps={{
              style: {
                fontFamily:
                  'SF Mono, Monaco, Consolas, "Courier New", monospace',
              },
            }}
          >
            {codeContent.trim()}
          </SyntaxHighlighter>
        ) : (
          <pre className="bg-muted/20 m-0 p-4 font-mono text-sm leading-relaxed whitespace-pre">
            <code className={cn("block", className)} {...props}>
              {codeContent}
            </code>
          </pre>
        )}
      </div>
    </div>
  );
};

const InlineCode = ({ children, ...props }: any) => (
  <code
    className="bg-muted rounded px-1.5 py-0.5 font-mono text-sm break-words"
    {...props}
  >
    {children}
  </code>
);

const BlockQuote = ({ children, ...props }: any) => (
  <blockquote
    className="border-primary text-muted-foreground my-4 border-l-4 pl-4 italic"
    {...props}
  >
    {children}
  </blockquote>
);

const Table = ({ children, ...props }: any) => (
  <div className="border-border my-4 overflow-x-auto rounded-lg border">
    <table className="min-w-full border-collapse" {...props}>
      {children}
    </table>
  </div>
);

const TableHead = ({ children, ...props }: any) => (
  <thead className="bg-muted/50" {...props}>
    {children}
  </thead>
);

const TableRow = ({ children, ...props }: any) => (
  <tr className="border-border hover:bg-muted/30 border-b" {...props}>
    {children}
  </tr>
);

const TableCell = ({ children, ...props }: any) => (
  <td
    className="border-border border-r p-3 align-top text-sm last:border-r-0"
    {...props}
  >
    <div className="min-w-0 break-words">{children}</div>
  </td>
);

const TableHeaderCell = ({ children, ...props }: any) => (
  <th
    className="border-border bg-muted/50 border-r p-3 text-left text-sm font-semibold last:border-r-0"
    {...props}
  >
    <div className="min-w-0 break-words">{children}</div>
  </th>
);

const List = ({ ordered, children, ...props }: any) => {
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag
      className={cn(
        "my-4 space-y-2 pl-6",
        ordered ? "list-decimal" : "list-disc",
      )}
      {...props}
    >
      {children}
    </Tag>
  );
};

const ListItem = ({ children, ...props }: any) => {
  // Check if this is a task list item
  const isTaskList = React.Children.toArray(children).some(
    (child) =>
      React.isValidElement(child) &&
      child.type === "input" &&
      (child.props as any)?.type === "checkbox",
  );

  return (
    <li className={cn("text-sm", isTaskList && "-ml-6 list-none")} {...props}>
      {children}
    </li>
  );
};

const Heading = ({ level, children, ...props }: any) => {
  const sizeClasses = {
    1: "text-2xl font-bold mt-6 mb-4",
    2: "text-xl font-semibold mt-5 mb-3",
    3: "text-lg font-semibold mt-4 mb-2",
    4: "text-base font-semibold mt-3 mb-2",
    5: "text-sm font-semibold mt-2 mb-1",
    6: "text-xs font-semibold mt-2 mb-1",
  };

  const className = cn(
    sizeClasses[level as keyof typeof sizeClasses] || sizeClasses[1],
  );

  switch (level) {
    case 1:
      return (
        <h1 className={className} {...props}>
          {children}
        </h1>
      );
    case 2:
      return (
        <h2 className={className} {...props}>
          {children}
        </h2>
      );
    case 3:
      return (
        <h3 className={className} {...props}>
          {children}
        </h3>
      );
    case 4:
      return (
        <h4 className={className} {...props}>
          {children}
        </h4>
      );
    case 5:
      return (
        <h5 className={className} {...props}>
          {children}
        </h5>
      );
    case 6:
      return (
        <h6 className={className} {...props}>
          {children}
        </h6>
      );
    default:
      return (
        <h1 className={className} {...props}>
          {children}
        </h1>
      );
  }
};

const Link = ({ href, children, ...props }: any) => (
  <a
    href={href}
    className="text-primary hover:text-primary/80 underline underline-offset-2"
    target="_blank"
    rel="noopener noreferrer"
    {...props}
  >
    {children}
  </a>
);

const HorizontalRule = ({ ...props }: any) => (
  <hr className="border-border my-6 border-t" {...props} />
);

const Paragraph = ({ children, ...props }: any) => (
  <div className="my-2 block text-sm leading-relaxed break-words" {...props}>
    {children}
  </div>
);

const Strong = ({ children, ...props }: any) => (
  <strong className="font-semibold" {...props}>
    {children}
  </strong>
);

const Emphasis = ({ children, ...props }: any) => (
  <em className="italic" {...props}>
    {children}
  </em>
);

const Strikethrough = ({ children, ...props }: any) => (
  <del className="line-through" {...props}>
    {children}
  </del>
);

export const markdownComponents: Components = {
  // Block elements
  p: Paragraph,
  h1: (props) => <Heading level={1} {...props} />,
  h2: (props) => <Heading level={2} {...props} />,
  h3: (props) => <Heading level={3} {...props} />,
  h4: (props) => <Heading level={4} {...props} />,
  h5: (props) => <Heading level={5} {...props} />,
  h6: (props) => <Heading level={6} {...props} />,
  blockquote: BlockQuote,
  ul: (props) => <List ordered={false} {...props} />,
  ol: (props) => <List ordered={true} {...props} />,
  li: ListItem,
  hr: HorizontalRule,

  // Table elements
  table: Table,
  thead: TableHead,
  tbody: ({ children, ...props }) => <tbody {...props}>{children}</tbody>,
  tr: TableRow,
  td: TableCell,
  th: TableHeaderCell,

  // Code elements
  code: ({ inline, className, children, ...props }: any) => {
    return inline ? (
      <InlineCode className={className} {...props}>
        {children}
      </InlineCode>
    ) : (
      <CodeBlock className={className} {...props}>
        {children}
      </CodeBlock>
    );
  },
  pre: ({ children, ...props }: any) => {
    // When using with code blocks, we handle the pre in CodeBlock
    if (React.isValidElement(children) && children.type === "code") {
      return children;
    }
    return (
      <pre
        className="bg-muted/50 my-4 overflow-x-auto rounded-md p-4 font-mono text-sm"
        {...props}
      >
        {children}
      </pre>
    );
  },

  // Inline elements
  a: Link,
  strong: Strong,
  em: Emphasis,
  del: Strikethrough,

  // Task lists (GitHub Flavored Markdown)
  input: ({ type, checked, ...props }: any) => {
    if (type === "checkbox") {
      return (
        <input
          type="checkbox"
          checked={checked}
          disabled
          className="mr-2 cursor-default"
          {...props}
        />
      );
    }
    return <input type={type} {...props} />;
  },
};
