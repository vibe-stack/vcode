import React from 'react';
import DotMatrix from '@/components/ui/animated-dot-matrix';

interface StreamingIndicatorProps {
    status: 'submitted' | 'streaming' | 'ready' | 'error';
    isLoading: boolean;
}

export function StreamingIndicator({ status, isLoading }: StreamingIndicatorProps) {
    if (!isLoading) return null;

    return (
        <div className="flex justify-start p-3">
            <DotMatrix
                baseColor='#444'
                fillColor="#6b7280" // muted gray color
                dotSize={3}
                rows={3}
                fillSpeed={3000}
                autoFill={true}
            />
        </div>
    );
}
