
import React, { useState } from 'react';
import { Copy, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';

interface KeyDisplayProps {
  apiKey: string;
  className?: string;
}

export function KeyDisplay({ apiKey, className }: KeyDisplayProps) {
  const [showKey, setShowKey] = useState(false);
  
  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    toast('Copied', {
      description: 'API key copied to clipboard.',
    });
  };
  
  const toggleVisibility = () => {
    setShowKey(!showKey);
  };
  
  const formatApiKey = (key: string) => {
    if (showKey) return key;
    
    // When hidden, show first 4 and last 4 characters
    if (key.length <= 8) return '••••••••';
    
    return `${key.substring(0, 4)}${'•'.repeat(key.length - 8)}${key.substring(key.length - 4)}`;
  };
  
  return (
    <div className={cn("w-full", className)}>
      <div className="text-sm font-medium mb-2">API Key:</div>
      <div className="flex overflow-hidden">
        <div className="flex-1 relative bg-muted rounded-l-md border border-r-0 border-border p-2">
          <div className="flex items-center justify-center gap-2">
            {apiKey.split('').map((char, i) => (
              <div 
                key={i}
                className={cn(
                  "w-5 h-5 flex items-center justify-center text-sm font-mono rounded transition-all duration-300",
                  i % 3 === 0 ? "bg-primary/10" : i % 3 === 1 ? "bg-secondary/10" : "bg-accent/10"
                )}
              >
                {showKey ? char : '•'}
              </div>
            ))}
          </div>
          <div className="absolute inset-0 flex items-center">
            <code className="w-full px-2 text-center text-xs font-mono truncate">
              {formatApiKey(apiKey)}
            </code>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          className="rounded-none border-x-0"
          onClick={toggleVisibility}
        >
          {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
        <Button 
          variant="secondary" 
          size="sm"
          className="rounded-l-none"
          onClick={copyApiKey}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
