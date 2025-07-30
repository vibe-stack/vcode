import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import { cn } from '@/utils/tailwind';
import {
  Bold as BoldIcon, Italic as ItalicIcon, Strikethrough as StrikeIcon, Underline as UnderlineIcon, Code as CodeIcon, List as BulletListIcon, ListOrdered as OrderedListIcon, Quote as BlockquoteIcon, Heading as HeadingIcon, Link as LinkIcon, Image as ImageIcon, Table as TableIcon, Minus as HrIcon, CheckSquare2 as TaskListIcon, Highlighter as HighlightIcon, Subscript as SubscriptIcon, Superscript as SuperscriptIcon, Text as TextIcon,
} from 'lucide-react';

interface ToolbarProps {
  editor: any;
}

export const MarkdownEditorToolbar: React.FC<ToolbarProps> = ({ editor }) => (
  <div className="flex flex-wrap gap-1 items-center px-1 py-1 rounded-md bg-background/80 border border-border shadow-sm">
    {/* Text type dropdown */}
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="px-2 min-w-[90px] flex items-center justify-start text-left" title="Text type">
          <span className="text-xs text-muted-foreground">
            {editor?.isActive('paragraph') && 'Paragraph'}
            {editor?.isActive('heading', { level: 1 }) && 'H1'}
            {editor?.isActive('heading', { level: 2 }) && 'H2'}
            {editor?.isActive('heading', { level: 3 }) && 'H3'}
            {editor?.isActive('heading', { level: 4 }) && 'H4'}
            {editor?.isActive('heading', { level: 5 }) && 'H5'}
            {editor?.isActive('heading', { level: 6 }) && 'H6'}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={4} className="min-w-[8rem]">
        <DropdownMenuItem onClick={() => editor?.chain().focus().setParagraph().run()} className={cn({ 'bg-accent': editor?.isActive('paragraph') })}>
          <TextIcon size={16} className="text-muted-foreground mr-2" />Paragraph
        </DropdownMenuItem>
        {[1,2,3,4,5,6].map(level => (
          <DropdownMenuItem key={level} onClick={() => editor?.chain().focus().toggleHeading({ level }).run()} className={cn({ 'bg-accent': editor?.isActive('heading', { level }) })}>
            <HeadingIcon size={16} className="text-muted-foreground mr-2" />Heading {level}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
    {/* Formatting buttons */}
    <Button variant="ghost" size="sm" title="Bold" onClick={() => editor?.chain().focus().toggleBold().run()} className={cn({ 'bg-accent': editor?.isActive('bold') })}>
      <BoldIcon size={18} className="text-muted-foreground" />
    </Button>
    <Button variant="ghost" size="sm" title="Italic" onClick={() => editor?.chain().focus().toggleItalic().run()} className={cn({ 'bg-accent': editor?.isActive('italic') })}>
      <ItalicIcon size={18} className="text-muted-foreground" />
    </Button>
    <Button variant="ghost" size="sm" title="Strikethrough" onClick={() => editor?.chain().focus().toggleStrike().run()} className={cn({ 'bg-accent': editor?.isActive('strike') })}>
      <StrikeIcon size={18} className="text-muted-foreground" />
    </Button>
    <Button variant="ghost" size="sm" title="Underline" onClick={() => editor?.chain().focus().toggleUnderline().run()} className={cn({ 'bg-accent': editor?.isActive('underline') })}>
      <UnderlineIcon size={18} className="text-muted-foreground" />
    </Button>
    <Button variant="ghost" size="sm" title="Code" onClick={() => editor?.chain().focus().toggleCode().run()} className={cn({ 'bg-accent': editor?.isActive('code') })}>
      <CodeIcon size={18} className="text-muted-foreground" />
    </Button>
    <Button variant="ghost" size="sm" title="Code Block" onClick={() => editor?.chain().focus().toggleCodeBlock().run()} className={cn({ 'bg-accent': editor?.isActive('codeBlock') })}>
      <CodeIcon size={18} className="text-muted-foreground opacity-70" />
    </Button>
    <Button variant="ghost" size="sm" title="Blockquote" onClick={() => editor?.chain().focus().toggleBlockquote().run()} className={cn({ 'bg-accent': editor?.isActive('blockquote') })}>
      <BlockquoteIcon size={18} className="text-muted-foreground" />
    </Button>
    <Button variant="ghost" size="sm" title="Bullet List" onClick={() => editor?.chain().focus().toggleBulletList().run()} className={cn({ 'bg-accent': editor?.isActive('bulletList') })}>
      <BulletListIcon size={18} className="text-muted-foreground" />
    </Button>
    <Button variant="ghost" size="sm" title="Ordered List" onClick={() => editor?.chain().focus().toggleOrderedList().run()} className={cn({ 'bg-accent': editor?.isActive('orderedList') })}>
      <OrderedListIcon size={18} className="text-muted-foreground" />
    </Button>
    <Button variant="ghost" size="sm" title="Task List" onClick={() => editor?.chain().focus().toggleTaskList().run()} className={cn({ 'bg-accent': editor?.isActive('taskList') })}>
      <TaskListIcon size={18} className="text-muted-foreground" />
    </Button>
    <Button variant="ghost" size="sm" title="Indent (Tab)" onClick={() => editor?.chain().focus().sinkListItem('listItem').run()}>
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-muted-foreground"><path d="M4 4v10m3-5h7m-2-2 2 2-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </Button>
    <Button variant="ghost" size="sm" title="Outdent (Shift+Tab)" onClick={() => editor?.chain().focus().liftListItem('listItem').run()}>
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-muted-foreground"><path d="M4 4v10m7-5H4m2-2-2 2 2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </Button>
    <Button variant="ghost" size="sm" title="Horizontal Rule" onClick={() => editor?.chain().focus().setHorizontalRule().run()}>
      <HrIcon size={18} className="text-muted-foreground" />
    </Button>
    <Button variant="ghost" size="sm" title="Link" onClick={() => {
      const url = window.prompt('Enter URL');
      if (url) editor?.chain().focus().toggleLink({ href: url }).run();
    }} className={cn({ 'bg-accent': editor?.isActive('link') })}>
      <LinkIcon size={18} className="text-muted-foreground" />
    </Button>
    <Button variant="ghost" size="sm" title="Image" onClick={() => {
      const url = window.prompt('Enter image URL');
      if (url) editor?.chain().focus().setImage({ src: url }).run();
    }}>
      <ImageIcon size={18} className="text-muted-foreground" />
    </Button>
    <Button variant="ghost" size="sm" title="Table" onClick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} className={cn({ 'bg-accent': editor?.isActive('table') })}>
      <TableIcon size={18} className="text-muted-foreground" />
    </Button>
    <Button variant="ghost" size="sm" title="Highlight" onClick={() => editor?.chain().focus().toggleHighlight().run()} className={cn({ 'bg-accent': editor?.isActive('highlight') })}>
      <HighlightIcon size={18} className="text-muted-foreground" />
    </Button>
    <Button variant="ghost" size="sm" title="Subscript" onClick={() => editor?.chain().focus().toggleSubscript().run()} className={cn({ 'bg-accent': editor?.isActive('subscript') })}>
      <SubscriptIcon size={18} className="text-muted-foreground" />
    </Button>
    <Button variant="ghost" size="sm" title="Superscript" onClick={() => editor?.chain().focus().toggleSuperscript().run()} className={cn({ 'bg-accent': editor?.isActive('superscript') })}>
      <SuperscriptIcon size={18} className="text-muted-foreground" />
    </Button>
  </div>
);
