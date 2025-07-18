import React from 'react';
import { Progress } from '../../../../components/ui/progress';
import { Agent } from './types';

interface AgentProgressProps {
  agent: Agent;
  className?: string;
}

export const AgentProgress: React.FC<AgentProgressProps> = ({ 
  agent, 
  className = '' 
}) => {
  if (!agent.progress) return null;

  const { currentStep, totalSteps = 0, completedSteps = 0 } = agent.progress;
  const progressPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  // Show progress bar for active or completed work
  const showProgress = agent.status === 'doing' || completedSteps > 0;

  if (!showProgress) return null;

  return (
    <div className={`space-y-1 ${className}`}>
      {currentStep && (
        <p className="text-xs text-muted-foreground truncate">
          {currentStep}
        </p>
      )}
      
      <div className="flex items-center gap-2">
        <Progress 
          value={progressPercentage} 
          className="h-1.5 flex-1"
        />
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {completedSteps}/{totalSteps}
        </span>
      </div>
    </div>
  );
};
