import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sphere } from 'three';

type MapBuilderToolName = 'addCube' | 'addSphere' | 'addCylinder' | 'addPlane' | 'addDoor' | 'removeObject' | 'getObjects' | 'getObject' | 'getFullScene';

interface MapToolDisplayProps {
  toolName: MapBuilderToolName;
  args: any;
  result?: any;
  state: 'call' | 'result' | string;
}

// Helper to format args for display
const formatArgs = (args: any): string => {
  if (!args || typeof args !== 'object') return '';
  return JSON.stringify(args, null, 2);
};

// Helper to format result for display
const formatResult = (result: any): string => {
  if (!result) return '';
  if (typeof result === 'string') return result;
  return JSON.stringify(result, null, 2);
};

export function MapToolDisplay({ toolName, args, result, state }: MapToolDisplayProps) {
  const getToolLabel = () => {
    switch (toolName) {
      case 'addCube':
        return `Add Cube`;
      case 'addSphere':
        return `Add Sphere`;
      case 'addCylinder':
        return `Add Cylinder`;
      case 'addDoor':
        return `Add Door`;
      case 'removeObject':
        return `Remove Object`;
      case 'getObjects':
        return `Get All Objects`;
      case 'getObject':
        return `Get Object`;
      case 'getFullScene':
        return `Get Full Scene`;
      default:
        return toolName;
    }
  };

  const getToolDetails = () => {
    switch (toolName) {
      case 'addCube':
        return {
          summary: `Adding cube`,
          details: { 
            position: args?.position,
            size: args?.size,
            color: args?.color,
            material: args?.material
          }
        };
      case 'addSphere':
        return {
          summary: `Adding Sphere`,
          details: { 
            position: args?.position,
            radius: args?.radius,
            color: args?.color,
            material: args?.material
          }
        };
      case 'addCylinder':
        return {
          summary: `Adding cylinder`,
          details: { 
            position: args?.position,
            radius: args?.radius,
            height: args?.height,
            color: args?.color,
            material: args?.material
          }
        };
      case 'addDoor':
        return {
          summary: `Adding door`,
          details: { 
            position: args?.position,
            width: args?.width,
            height: args?.height,
            depth: args?.depth,
            cutoutWidth: args?.cutoutWidth,
            cutoutHeight: args?.cutoutHeight,
            cutoutRadius: args?.cutoutRadius,
            color: args?.color,
            material: args?.material
          }
        };
      case 'removeObject':
        return {
          summary: `Removing object (#${args?.id || 'unknown'})`,
          details: { id: args?.id }
        };
      case 'getObjects':
        return {
          summary: 'Getting all objects in the scene',
          details: {}
        };
      case 'getObject':
        return {
          summary: `Getting object (#${args?.id || 'unknown'})`,
          details: { id: args?.id }
        };
      case 'getFullScene':
        return {
          summary: 'Getting complete scene information',
          details: {}
        };
      default:
        return {
          summary: toolName,
          details: args
        };
    }
  };

  const toolDetails = getToolDetails();

  return (
    <div className="space-y-2">
      <Card className="text-xs border-muted">
        <CardHeader className="pb-3 pt-3">
          <CardTitle className="text-sm flex items-center gap-2">
            {toolName}
            <Badge variant="secondary" className="text-xs">
              {state}
            </Badge>
          </CardTitle>
          <p className="text-muted-foreground text-xs">{toolDetails.summary}</p>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div>
            <p className="font-medium text-muted-foreground mb-2 text-xs">Arguments:</p>
            <pre className="bg-muted/50 p-2 rounded text-xs overflow-x-auto border">
              {formatArgs(args)}
            </pre>
          </div>
          
          {result && (
            <div>
              <p className="font-medium text-muted-foreground mb-2 text-xs">Result:</p>
              <pre className="bg-muted/50 p-2 rounded text-xs overflow-x-auto max-h-40 overflow-y-auto border">
                {formatResult(result)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
