import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, Construction } from 'lucide-react';

export default function MessagesSection() {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <MessageCircle className="h-8 w-8 text-emerald-600" />
          <div>
            <h1 className="text-3xl font-bold">Messages</h1>
            <p className="text-muted-foreground mt-1">
              Connect and collaborate with the community
            </p>
          </div>
        </div>
      </div>

      {/* Coming Soon Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <Construction className="h-16 w-16 mx-auto mb-4 text-emerald-600" />
            <CardTitle className="text-2xl">Coming Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              We're building an amazing messaging system that will let you:
            </p>
            <ul className="text-left space-y-2 text-sm text-muted-foreground">
              <li>• Chat with project collaborators</li>
              <li>• Join community discussions</li>
              <li>• Get real-time notifications</li>
              <li>• Share code snippets and ideas</li>
              <li>• Participate in project reviews</li>
            </ul>
            <p className="text-sm text-emerald-600 mt-4 font-medium">
              Stay tuned for updates!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
