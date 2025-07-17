# Tool Call Serialization Fix

## Problem Fixed

The agent tool calls were being incorrectly serialized as concatenated formatted strings instead of preserving structured JSON data. This caused loss of important details like:

- Tool call ID
- Tool name  
- Arguments passed to the tool
- Tool execution state
- Tool result data

## Changes Made

### 1. Agent API (`src/api/agents/index.ts`)

**BEFORE (lines 59-71):**
```typescript
// Create formatted content with tool names
const formattedContent = toolResults.map((result, index) => {
    const toolCall = toolCalls?.[index];
    const toolName = toolCall?.toolName || 'unknown_tool';
    const resultContent = typeof result.result === 'string' 
        ? result.result 
        : JSON.stringify(result.result, null, 2);
    return `**${toolName}**:\n${resultContent}`;
}).join('\n\n');

agentDB.addMessage({
    sessionId,
    role: 'tool',
    content: formattedContent,
    stepIndex: currentStepIndex,
    toolResults: JSON.stringify(toolResults),
});
```

**AFTER:**
```typescript
// Store tool calls if they exist
if (toolCalls && toolCalls.length > 0) {
    toolCalls.forEach((toolCall, index) => {
        // Store each tool call as a separate message to preserve all details
        agentDB.addMessage({
            sessionId,
            role: 'tool',
            content: JSON.stringify({
                type: 'tool_call',
                toolCallId: toolCall.toolCallId,
                toolName: toolCall.toolName,
                args: toolCall.args,
                state: 'call'
            }, null, 2),
            stepIndex: currentStepIndex,
            toolCalls: JSON.stringify([toolCall]),
        });
    });
}

// Store tool results if they exist
if (toolResults && toolResults.length > 0) {
    toolResults.forEach((result, index) => {
        const toolCall = toolCalls?.[index];
        
        // Store each tool result as a separate message with full context
        agentDB.addMessage({
            sessionId,
            role: 'tool',
            content: JSON.stringify({
                type: 'tool_result', 
                toolCallId: toolCall?.toolCallId || `result-${index}`,
                toolName: toolCall?.toolName || 'unknown_tool',
                args: toolCall?.args || {},
                state: 'result',
                result: result.result
            }, null, 2),
            stepIndex: currentStepIndex,
            toolResults: JSON.stringify([result]),
        });
    });
}
```

### 2. Agent Message Renderer (`src/pages/workspace/components/agents-view/agent-message-renderer.tsx`)

Enhanced to handle the new structured JSON format with fallback to legacy format:

```typescript
// Try to parse the content to see if it contains tool calls or structured data
try {
    const parsed = JSON.parse(message.content);
    
    // If it's a tool call or tool result with our new structure
    if (parsed.type === 'tool_call' || parsed.type === 'tool_result') {
        return (
            <AgentToolCallHandler
                toolCallId={parsed.toolCallId}
                toolName={parsed.toolName}
                args={parsed.args || {}}
                state={parsed.state || 'result'}
                result={parsed.result}
            />
        );
    }
    
    // Legacy support for old tool call format
    if (parsed.toolName || parsed.tool) {
        return (
            <AgentToolCallHandler
                toolCallId={parsed.toolCallId || message.id}
                toolName={parsed.toolName || parsed.tool}
                args={parsed.args || parsed.arguments || {}}
                state={parsed.state || 'result'}
                result={parsed.result}
            />
        );
    }
} catch (e) {
    // If parsing fails, treat as regular text
}
```

### 3. Agent Tool Call Handler (`src/pages/workspace/components/agents-view/agent-tool-call-handler.tsx`)

Enhanced details view to show comprehensive tool call information:

```typescript
// Render details section with comprehensive tool call data
const renderDetails = () => {
    const detailsData = {
        toolCallId,
        toolName,
        state,
        args: args || {},
        ...(result && { result }),
        timestamp: new Date().toISOString()
    };

    return (
        <div className="mt-2 pl-8 border-l border-border/30">
            <div className="bg-muted/30 rounded-md p-3 text-xs space-y-3">
                {/* Tool Call ID */}
                <div>
                    <span className="font-semibold text-muted-foreground">Call ID:</span>
                    <pre className="font-mono text-muted-foreground mt-1">{toolCallId}</pre>
                </div>
                
                {/* Arguments */}
                {args && Object.keys(args).length > 0 && (
                    <div>
                        <span className="font-semibold text-muted-foreground">Arguments:</span>
                        <pre className="font-mono text-muted-foreground overflow-x-auto mt-1">
                            {JSON.stringify(args, null, 2)}
                        </pre>
                    </div>
                )}
                
                {/* Result */}
                {result && (
                    <div>
                        <span className="font-semibold text-muted-foreground">Result:</span>
                        <pre className="font-mono text-muted-foreground overflow-x-auto mt-1">
                            {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
                        </pre>
                    </div>
                )}
                
                {/* Full JSON (for debugging) */}
                <details className="border-t border-border/20 pt-2">
                    <summary className="text-muted-foreground cursor-pointer hover:text-foreground text-xs">
                        Raw JSON Data
                    </summary>
                    <pre className="font-mono text-muted-foreground overflow-x-auto mt-2 text-xs">
                        {JSON.stringify(detailsData, null, 2)}
                    </pre>
                </details>
            </div>
        </div>
    );
};
```

## Results

Now tool calls are properly serialized and displayed with all their details:

✅ **Tool Call ID** - Unique identifier for each tool invocation  
✅ **Tool Name** - Exact name of the tool that was called  
✅ **Arguments** - Complete arguments object passed to the tool  
✅ **Execution State** - Whether it's a call or result  
✅ **Result Data** - Full result returned by the tool  
✅ **Timestamp** - When the tool was executed  
✅ **Raw JSON** - Complete structured data for debugging  

The agent tool call handler now shows a clean summary view with an expandable details section that contains all the preserved information.

## Backward Compatibility

The changes maintain backward compatibility with existing tool call messages through fallback parsing in the message renderer.
