import React, { useState } from 'react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Textarea } from '../../../../components/ui/textarea';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../../../../components/ui/sheet';
import { Plus, Bot, Sparkles } from 'lucide-react';
import { CreateAgentRequest } from './types';
import { useProjectStore } from '@/stores/project';

interface CreateAgentFormProps {
  onCreateAgent: (request: CreateAgentRequest) => Promise<void>;
  isLoading?: boolean;
}

export const CreateAgentForm: React.FC<CreateAgentFormProps> = ({
  onCreateAgent,
  isLoading = false
}) => {
  const [open, setOpen] = useState(false);
  const { currentProject, projectName } = useProjectStore();
  
  const [formData, setFormData] = useState<CreateAgentRequest>({
    name: '',
    description: '', // Keep for API compatibility but won't show in UI
    projectPath: currentProject || '',
    projectName: projectName || undefined,
    initialPrompt: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !currentProject) {
      return;
    }

    try {
      await onCreateAgent({
        ...formData,
        description: formData.name, // Use title as description for API compatibility
        projectPath: currentProject,
        projectName: projectName || undefined
      });
      
      // Reset form and close sheet
      setFormData({
        name: '',
        description: '',
        projectPath: currentProject,
        projectName: projectName || undefined,
        initialPrompt: ''
      });
      setOpen(false);
    } catch (error) {
      console.error('Failed to create agent:', error);
    }
  };

  const updateField = (field: keyof CreateAgentRequest) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          New Agent
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[480px] sm:w-[540px] p-4">
        <SheetHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-xl">Create New Agent</SheetTitle>
              <SheetDescription className="text-sm">
                Build an AI agent for{' '}
                <span className="font-mono text-foreground bg-muted px-1.5 py-0.5 rounded text-xs">
                  {projectName || currentProject}
                </span>
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>
        
        <div className="flex-1 overflow-auto py-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <Label htmlFor="agent-title" className="text-sm font-medium">
                  Agent Title
                </Label>
              </div>
              <Input
                id="agent-title"
                placeholder="e.g., Authentication System, API Documentation, Bug Fixer"
                value={formData.name}
                onChange={updateField('name')}
                required
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">
                Give your agent a clear, descriptive title that explains its purpose.
              </p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="agent-instructions" className="text-sm font-medium">
                Instructions
              </Label>
              <Textarea
                id="agent-instructions"
                placeholder="Provide detailed instructions about what you want the agent to accomplish. Be specific about the goals, requirements, and any constraints..."
                value={formData.initialPrompt}
                onChange={updateField('initialPrompt')}
                rows={8}
                className="resize-none min-h-[200px]"
              />
              <p className="text-xs text-muted-foreground">
                The more specific your instructions, the better your agent will perform. Include goals, constraints, and preferred approaches.
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-4 border-t">
              <Button 
                type="submit" 
                disabled={isLoading || !formData.name.trim()}
                className="w-full h-11"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Creating Agent...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Agent
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
};
