import React, { useState } from 'react';
import { Users, MessageSquare, Lock, Unlock, Send, Globe, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { usePresenceStore } from '@/stores/presence';
import { cn } from '@/utils/tailwind';

export function PresenceIndicator() {
  const {
    lockedInCount,
    lockedInUsers,
    recentMessages,
    isLockedIn,
    mode,
    setMode,
    updateMyPresence,
    sendMessage
  } = usePresenceStore();

  const [showSheet, setShowSheet] = useState(false);
  const [message, setMessage] = useState('');

  const handleToggleLockIn = () => {
    updateMyPresence(!isLockedIn, 'grok-ide');
  };

  const handleSendMessage = async () => {
    if (message.trim() && isLockedIn) {
      await sendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex items-center gap-1">
      {/* Lock In Toggle Button - More Subtle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleToggleLockIn}
        className={cn(
          "h-6 w-6 p-0 transition-all duration-200",
          isLockedIn 
            ? "text-green-400 hover:text-green-300" 
            : "text-muted-foreground hover:text-foreground"
        )}
        title={isLockedIn ? "You're locked in! Click to unlock" : "Click to lock in"}
      >
        {isLockedIn ? (
          <Lock size={12} />
        ) : (
          <Unlock size={12} />
        )}
      </Button>

      {/* Presence Count Sheet - More Subtle */}
      <Sheet open={showSheet} onOpenChange={setShowSheet}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 hover:bg-slate-700/50 rounded-md transition-colors text-muted-foreground hover:text-foreground"
            title={`${lockedInCount} users locked in`}
          >
            <Users size={11} className="mr-1" />
            <Badge variant="outline" className="text-xs h-4 px-1 bg-transparent border-muted-foreground/30 text-muted-foreground">
              {lockedInCount}
            </Badge>
          </Button>
        </SheetTrigger>
        
        <SheetContent className="w-96 p-4">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Users size={16} />
              Locked In Users ({lockedInCount})
            </SheetTitle>
          </SheetHeader>
          
          <div className="space-y-4 mt-6">
            {/* Mode Selector */}
            <div>
              <h3 className="text-sm font-medium mb-2">View Mode</h3>
              <ToggleGroup 
                type="single" 
                value={mode} 
                onValueChange={(value) => value && setMode(value as 'global' | 'mutuals')}
                className="justify-start"
              >
                <ToggleGroupItem value="global" className="flex items-center gap-2">
                  <Globe size={14} />
                  Global
                </ToggleGroupItem>
                <ToggleGroupItem value="mutuals" className="flex items-center gap-2">
                  <UserCheck size={14} />
                  Mutuals
                </ToggleGroupItem>
              </ToggleGroup>
              <p className="text-xs text-muted-foreground mt-1">
                {mode === 'global' 
                  ? 'See all locked-in users across the platform' 
                  : 'Only see users you follow who also follow you back'
                }
              </p>
            </div>

            <Separator />
            {/* Currently Locked In Users */}
            <div>
              <h3 className="text-sm font-medium mb-2">Currently Active</h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {lockedInUsers.length > 0 ? (
                  lockedInUsers.map((user) => (
                    <div key={user.userId} className="flex items-center justify-between text-sm">
                      <div>
                        <span className="font-medium">
                          {user.user.displayUsername || user.user.username || user.user.name}
                        </span>
                        {user.projectName && (
                          <span className="text-muted-foreground ml-2">
                            working on {user.projectName}
                          </span>
                        )}
                      </div>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No one is locked in right now</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Recent Messages */}
            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                <MessageSquare size={14} />
                Recent Messages
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {recentMessages.length > 0 ? (
                  recentMessages.slice(0, 5).map((msg) => (
                    <div key={msg.id} className="text-sm">
                      <span className="font-medium text-blue-400">
                        {msg.user.displayUsername || msg.user.username || msg.user.name}
                      </span>
                      <span className="text-muted-foreground ml-2">
                        "{msg.message}"
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {Math.floor((Date.now() - msg.createdAt) / 60000)}m ago
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No recent messages</p>
                )}
              </div>
            </div>

            {/* Send Message (only if locked in) */}
            {isLockedIn && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-medium mb-2">Send a Message</h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    You can send one message per hour while locked in
                  </p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="GRIND HARDER NABS"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      maxLength={200}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={handleSendMessage}
                      disabled={!message.trim()}
                    >
                      <Send size={14} />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
