import React from 'react';
import { Badge } from '../../../../components/ui/badge';
import { AgentStatus } from './types';
import { 
  Lightbulb, 
  Clock, 
  AlertCircle, 
  Play, 
  Eye, 
  Check, 
  X,
  Loader2
} from 'lucide-react';

interface AgentStatusBadgeProps {
  status: AgentStatus;
  className?: string;
}

const statusConfig = {
  ideas: {
    label: 'Ideas',
    icon: Lightbulb,
    variant: 'secondary' as const,
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    animate: false
  },
  todo: {
    label: 'Todo',
    icon: Clock,
    variant: 'secondary' as const,
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    animate: false
  },
  need_clarification: {
    label: 'Needs Clarification',
    icon: AlertCircle,
    variant: 'destructive' as const,
    className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
    animate: false
  },
  doing: {
    label: 'Running',
    icon: Loader2,
    variant: 'default' as const,
    className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    animate: true
  },
  review: {
    label: 'Review',
    icon: Eye,
    variant: 'secondary' as const,
    className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
    animate: false
  },
  accepted: {
    label: 'Accepted',
    icon: Check,
    variant: 'secondary' as const,
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400',
    animate: false
  },
  rejected: {
    label: 'Rejected',
    icon: X,
    variant: 'secondary' as const,
    className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    animate: false
  }
};

export const AgentStatusBadge: React.FC<AgentStatusBadgeProps> = ({ 
  status, 
  className = '' 
}) => {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant}
      className={`gap-1.5 ${config.className} ${className}`}
    >
      <Icon 
        className={`h-3 w-3 ${config.animate ? 'animate-spin' : ''}`} 
      />
      {config.label}
    </Badge>
  );
};
