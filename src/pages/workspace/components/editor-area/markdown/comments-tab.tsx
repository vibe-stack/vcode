import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCommentsStore, Comment } from '@/stores/comments';
import { MessageSquarePlus, MessageSquare, CheckCircle2, RotateCcw, Trash2, X } from 'lucide-react';
import { cn } from '@/utils/tailwind';
import { Editor } from '@tiptap/react';

interface CommentsTabProps {
  fileId: string;
  editor: Editor | null;
  isVisible: boolean;
  onHide: () => void;
}

export const CommentsTab: React.FC<CommentsTabProps> = ({ 
  fileId, 
  editor, 
  isVisible, 
  onHide 
}) => {
  const [activeTab, setActiveTab] = useState<'open' | 'resolved'>('open');
  const [newCommentText, setNewCommentText] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const {
    comments,
    addComment,
    updateComment,
    deleteComment,
    resolveComment,
    reopenComment,
    getCommentsForFile,
  } = useCommentsStore();

  const fileComments = getCommentsForFile(fileId);
  const openComments = fileComments.filter(c => c.status === 'open');
  const resolvedComments = fileComments.filter(c => c.status === 'resolved');

  const hasSelection = editor?.state.selection && 
    !editor.state.selection.empty && 
    editor.state.selection.from !== editor.state.selection.to;

  const handleAddComment = () => {
    if (!editor || !hasSelection || !newCommentText.trim()) return;

    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to);

    // Create the comment and get the generated ID
    const commentData = {
      text: newCommentText.trim(),
      status: 'open' as const,
      startPos: from,
      endPos: to,
      selectedText,
    };

    const commentId = addComment(fileId, commentData);

    // Apply comment mark to selection
    editor.chain()
      .focus()
      .setTextSelection({ from, to })
      .setComment(commentId)
      .run();

    // Reset form
    setNewCommentText('');
    setIsAddingComment(false);
  };

  const handleCancelComment = () => {
    setNewCommentText('');
    setIsAddingComment(false);
  };

  const handleCommentClick = (comment: Comment) => {
    if (!editor) return;
    
    // Navigate to comment position and select the text
    editor.chain()
      .focus()
      .setTextSelection({ from: comment.startPos, to: comment.endPos })
      .scrollIntoView()
      .run();
  };

  const handleResolveComment = (comment: Comment) => {
    resolveComment(comment.id);
  };

  const handleReopenComment = (comment: Comment) => {
    reopenComment(comment.id);
  };

  const handleDeleteComment = (comment: Comment) => {
    deleteComment(comment.id);
    
    // Remove comment mark from editor if it exists
    if (editor) {
      const { doc } = editor.state;
      let foundMark = false;
      
      doc.descendants((node, pos) => {
        if (foundMark) return false;
        
        node.marks.forEach(mark => {
          if (mark.type.name === 'comment' && mark.attrs.commentId === comment.id) {
            editor.chain()
              .focus()
              .setTextSelection({ from: pos, to: pos + node.nodeSize })
              .unsetComment()
              .run();
            foundMark = true;
          }
        });
      });
    }
  };

  useEffect(() => {
    if (isAddingComment && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isAddingComment]);

  if (!isVisible) return null;

  return (
    <div className="w-80 border-l border-border bg-background/50 overflow-auto">
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Comments</span>
          <button
            onClick={onHide}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="p-3">
        {/* Add Comment Section */}
        <div className="mb-3">
          {!isAddingComment ? (
            <Button
              variant="outline"
              size="sm"
              disabled={!hasSelection}
              onClick={() => setIsAddingComment(true)}
              className="w-full h-8 text-xs"
            >
              <MessageSquarePlus size={14} className="mr-2" />
              Add Comment
              {!hasSelection && (
                <span className="ml-2 text-xs text-muted-foreground">
                  (select text first)
                </span>
              )}
            </Button>
          ) : (
            <div className="space-y-2">
              <Textarea
                ref={textareaRef}
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Write your comment..."
                rows={3}
                className="text-xs resize-none"
              />
              <div className="flex gap-1">
                <Button size="sm" onClick={handleAddComment} disabled={!newCommentText.trim()} className="h-7 text-xs">
                  Add
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelComment} className="h-7 text-xs">
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Comments List */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'open' | 'resolved')}>
          <TabsList className="grid w-full grid-cols-2 mb-2 h-8">
            <TabsTrigger value="open" className="text-xs h-6">
              Open ({openComments.length})
            </TabsTrigger>
            <TabsTrigger value="resolved" className="text-xs h-6">
              Resolved ({resolvedComments.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="open" className="space-y-2">
            {openComments.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-6">
                No open comments
              </div>
            ) : (
              openComments.map((comment) => (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  onCommentClick={handleCommentClick}
                  onResolve={handleResolveComment}
                  onDelete={handleDeleteComment}
                  onUpdateText={(text) => updateComment(comment.id, { text })}
                />
              ))
            )}
          </TabsContent>
          
          <TabsContent value="resolved" className="space-y-2">
            {resolvedComments.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-6">
                No resolved comments
              </div>
            ) : (
              resolvedComments.map((comment) => (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  onCommentClick={handleCommentClick}
                  onReopen={handleReopenComment}
                  onDelete={handleDeleteComment}
                  onUpdateText={(text) => updateComment(comment.id, { text })}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

interface CommentCardProps {
  comment: Comment;
  onCommentClick: (comment: Comment) => void;
  onResolve?: (comment: Comment) => void;
  onReopen?: (comment: Comment) => void;
  onDelete: (comment: Comment) => void;
  onUpdateText: (text: string) => void;
}

const CommentCard: React.FC<CommentCardProps> = ({
  comment,
  onCommentClick,
  onResolve,
  onReopen,
  onDelete,
  onUpdateText,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);

  const handleSaveEdit = () => {
    if (editText.trim() && editText !== comment.text) {
      onUpdateText(editText.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditText(comment.text);
    setIsEditing(false);
  };

  // Truncate selected text to max 100 characters
  const truncatedSelectedText = comment.selectedText.length > 100 
    ? comment.selectedText.substring(0, 100) + '...' 
    : comment.selectedText;

  return (
    <div className={cn(
      "border rounded p-2 space-y-2 text-sm transition-colors hover:bg-muted/30",
      comment.status === 'resolved' 
        ? "border-muted bg-muted/20" 
        : "border-muted/50"
    )}>
      <div className="flex items-start justify-between gap-2">
        <Badge 
          variant={comment.status === 'resolved' ? 'secondary' : 'outline'} 
          className="text-xs h-5"
        >
          {comment.status}
        </Badge>
        <div className="flex gap-1">
          {comment.status === 'open' && onResolve && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onResolve(comment)}
              className="h-5 w-5 p-0 text-muted-foreground hover:text-green-600"
            >
              <CheckCircle2 size={10} />
            </Button>
          )}
          {comment.status === 'resolved' && onReopen && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReopen(comment)}
              className="h-5 w-5 p-0 text-muted-foreground hover:text-blue-600"
            >
              <RotateCcw size={10} />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(comment)}
            className="h-5 w-5 p-0 text-muted-foreground hover:text-red-500"
          >
            <Trash2 size={10} />
          </Button>
        </div>
      </div>
      
      <div
        className="text-xs text-muted-foreground bg-muted/30 p-1.5 rounded cursor-pointer hover:bg-muted/50 transition-colors border-l-2 border-muted italic"
        onClick={() => onCommentClick(comment)}
        title={comment.selectedText}
      >
        "{truncatedSelectedText}"
      </div>
      
      {isEditing ? (
        <div className="space-y-2">
          <Textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={2}
            className="text-xs resize-none"
          />
          <div className="flex gap-1">
            <Button size="sm" onClick={handleSaveEdit} className="h-6 text-xs">
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancelEdit} className="h-6 text-xs">
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div
          className="cursor-pointer hover:bg-muted/30 p-1 rounded transition-colors text-xs"
          onClick={() => setIsEditing(true)}
        >
          {comment.text}
        </div>
      )}
      
      <div className="text-xs text-muted-foreground/70 pt-1 border-t border-muted/30">
        {new Date(comment.createdAt).toLocaleDateString()} {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  );
};
