import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cpu, Construction } from 'lucide-react';

export default function MCPSection() {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <Cpu className="h-8 w-8 text-emerald-600" />
          <div>
            <h1 className="text-3xl font-bold">Model Context Protocol</h1>
            <p className="text-muted-foreground mt-1">
              AI-powered development tools and integrations
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
              The MCP integration will provide powerful AI capabilities:
            </p>
            <ul className="text-left space-y-2 text-sm text-muted-foreground">
              <li>• AI-powered code generation</li>
              <li>• Smart project analysis</li>
              <li>• Automated code reviews</li>
              <li>• Intelligent refactoring suggestions</li>
              <li>• Context-aware documentation</li>
            </ul>
            <p className="text-sm text-emerald-600 mt-4 font-medium">
              The future of AI-assisted development!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
