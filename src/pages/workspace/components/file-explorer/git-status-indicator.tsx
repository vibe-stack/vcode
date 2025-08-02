import React from 'react';
import { cn } from '@/utils/tailwind';
import { GitStatusIndicatorProps } from './types';

export const GitStatusIndicator: React.FC<GitStatusIndicatorProps> = ({
    gitIcon,
    gitColor,
    gitTooltip,
    isInlineEditing
}) => {
    if (!gitIcon || isInlineEditing) {
        return null;
    }

    return (
        <span className={cn("text-xs font-mono", gitColor)} title={gitTooltip}>
            {gitIcon}
        </span>
    );
};
