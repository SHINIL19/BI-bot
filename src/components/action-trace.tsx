"use client";

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, Terminal } from "lucide-react";

export type TraceLog = {
  id: string;
  timestamp: Date;
  type: "info" | "query" | "error" | "schema" | "success";
  message: string;
  details?: string;
};

interface ActionTraceProps {
  logs: TraceLog[];
  className?: string;
}

export function ActionTrace({ logs, className }: ActionTraceProps) {
  const getLogColor = (type: TraceLog["type"]) => {
    switch (type) {
      case "query":
        return "text-[#0073ea]"; // Monday Blue
      case "error":
        return "text-destructive";
      case "schema":
        return "text-purple-400";
      case "success":
        return "text-green-400";
      default:
        return "text-muted-foreground";
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full rounded-xl border bg-card/50 backdrop-blur-xl shadow-sm overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/20">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Terminal className="h-4 w-4" />
          <span>Live API Trace</span>
        </div>
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-destructive/80" />
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
          <div className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
        </div>
      </div>

      {/* Logs Area */}
      <ScrollArea className="flex-1 p-4 font-mono text-xs">
        {logs.length === 0 ? (
          <div className="text-muted-foreground h-full flex items-center justify-center italic">
            Waiting for agent activity...
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-muted-foreground/50" suppressHydrationWarning>
                    [{log.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second:'2-digit' })}]
                  </span>
                  <span className={cn("font-semibold", getLogColor(log.type))}>
                    {log.type.toUpperCase()}
                  </span>
                  <span className="text-foreground">{log.message}</span>
                </div>
                {log.details && (
                  <div className="ml-14 relative group">
                    <pre className="bg-muted p-2 rounded-md overflow-x-auto text-[10px] sm:text-xs">
                      {log.details}
                    </pre>
                    <button 
                      onClick={() => copyToClipboard(log.details!)}
                      className="absolute top-1.5 right-1.5 p-1 rounded bg-background/50 hover:bg-background opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Copy details"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
