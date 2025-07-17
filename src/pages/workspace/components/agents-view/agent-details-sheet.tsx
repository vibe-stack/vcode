import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../../../../components/ui/sheet';
import { ScrollArea } from '../../../../components/ui/scroll-area';
import { Separator } from '../../../../components/ui/separator';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { Textarea } from '../../../../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Agent, AgentMessage, AgentProgress } from './types';
import { AgentStatusBadge } from './agent-status-badge';
import { agentIpc } from './agent-ipc';
import { formatDistanceToNow, format } from 'date-fns';
import { MessageSquare, Send, Loader2, Clock, FolderOpen, Activity, TrendingUp } from 'lucide-react';
import { AgentMessageRenderer } from './agent-message-renderer';

interface AgentDetailsSheetProps {
  agent: Agent | null;
  open: boolean;
  onClose: () => void;
}

export const AgentDetailsSheet: React.FC<AgentDetailsSheetProps> = ({
  agent,
  open,
  onClose
}) => {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [progress, setProgress] = useState<AgentProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    if (agent && open) {
      loadAgentData();
    }
  }, [agent, open]);

  // Cleanup effect to ensure pointer events are restored
  useEffect(() => {
    if (!open) {
      // Force restore pointer events on body when modal closes
      const timeoutId = setTimeout(() => {
        document.body.style.pointerEvents = '';
      }, 100); // Small delay to ensure Radix cleanup runs first

      return () => clearTimeout(timeoutId);
    }
  }, [open]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.style.pointerEvents = '';
    };
  }, []);

  const loadAgentData = async () => {
    if (!agent) return;
    
    setLoading(true);
    try {
      const [messagesData, progressData] = await Promise.all([
        agentIpc.getMessages(agent.id),
        agentIpc.getProgress(agent.id)
      ]);
      setMessages(messagesData);
      setProgress(progressData);
    } catch (error) {
      console.error('Failed to load agent data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!agent || !newMessage.trim()) return;

    setSendingMessage(true);
    try {
      await agentIpc.addMessage(agent.id, 'user', newMessage.trim());
      setNewMessage('');
      await loadAgentData(); // Reload messages
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  if (!agent) return null;

  const canSendMessage = ['need_clarification', 'ideas', 'todo'].includes(agent.status);

  return (
    <Sheet modal open={open} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-[700px] sm:max-w-[700px] flex flex-col p-4">
        <SheetHeader className="pb-6">
          <div className="flex items-center gap-3">
            <SheetTitle className="flex-1 text-lg">{agent.name}</SheetTitle>
            <AgentStatusBadge status={agent.status} />
          </div>
          <SheetDescription className="text-base">
            {agent.description}
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col">
            {/* Agent Overview Cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Created</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {format(new Date(agent.createdAt), 'PPp')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Activity className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Last Updated</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {formatDistanceToNow(new Date(agent.updatedAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Progress Timeline */}
            {progress.length > 0 && (
              <Card className="mb-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Progress Timeline</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ScrollArea className="h-32">
                    <div className="space-y-3">
                      {progress.map((step) => (
                        <div key={step.id} className="flex items-start gap-3">
                          <Badge 
                            variant={step.status === 'completed' ? 'default' : step.status === 'failed' ? 'destructive' : 'secondary'}
                            className="text-xs shrink-0 mt-0.5"
                          >
                            {step.status}
                          </Badge>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">{step.step}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(step.timestamp), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* Messages - Takes remaining space */}
            <Card className="flex-1 min-h-0 flex flex-col">
              <CardHeader className="pb-3 shrink-0">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Conversation ({messages.length})
                </CardTitle>
              </CardHeader>
              
              <CardContent className="flex-1 min-h-0 flex flex-col pt-0">
                <ScrollArea className="flex-1 min-h-0">
                  <div className="space-y-4 pr-4">
                    {messages.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">
                          No messages yet
                        </p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <AgentMessageRenderer 
                          key={message.id} 
                          message={message}
                        />
                      ))
                    )}
                  </div>
                </ScrollArea>

                {/* Send Message */}
                {canSendMessage && (
                  <div className="space-y-3 pt-4 border-t shrink-0">
                    <Textarea
                      placeholder="Add a message or clarification..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      rows={3}
                      className="resize-none"
                    />
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sendingMessage}
                        className="gap-2"
                      >
                        {sendingMessage ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Send className="h-3 w-3" />
                        )}
                        Send
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
