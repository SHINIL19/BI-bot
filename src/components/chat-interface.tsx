"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Send, Bot, User, ShieldAlert, ChevronDown } from "lucide-react";
import { Message } from "ai";
import { useSettings } from "@/lib/use-settings";

interface ChatInterfaceProps {
    chatHelpers: {
        messages: Message[];
        input: string;
        handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
        handleSubmit: (e: React.FormEvent<HTMLFormElement>, options?: { data?: any }) => void;
        isLoading: boolean;
        error?: Error | undefined;
    };
    className?: string;
}

export function ChatInterface({
    chatHelpers,
    className
}: ChatInterfaceProps) {
    const { messages, input, handleInputChange, handleSubmit, isLoading, error } = chatHelpers;
    const scrollRef = useRef<HTMLDivElement>(null);
    const { settings, saveSettings } = useSettings();
    const [availableModels, setAvailableModels] = useState<{id: string, name: string}[]>([]);

    useEffect(() => {
        if (settings?.apiKey && settings?.provider) {
            fetch('/api/models', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider: settings.provider, apiKey: settings.apiKey })
            })
            .then(res => res.json())
            .then(data => {
                if (data.models) {
                    setAvailableModels(data.models);
                }
            })
            .catch(console.error);
        }
    }, [settings?.apiKey, settings?.provider]);

    // Auto-scroll to bottom on new message
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    return (
        <Card className={cn("flex flex-col h-full overflow-hidden border bg-card/40 backdrop-blur-2xl shadow-xl", className)}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-card/50">
                <div>
                    <h2 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
                        <Bot className="h-5 w-5 text-[#0073ea]" />
                        BI-Bot
                    </h2>
                    <p className="text-xs text-muted-foreground hidden sm:block">Executive Data Assistant</p>
                </div>
                
                {availableModels.length > 0 && settings && (
                    <div className="relative">
                        <select
                            value={settings.model || ''}
                            onChange={(e) => saveSettings({ ...settings, model: e.target.value })}
                            className="appearance-none bg-background text-xs border border-border/50 rounded-md py-1.5 pl-3 pr-8 focus:outline-none focus:ring-1 focus:ring-[#0073ea] max-w-[150px] truncate"
                        >
                            {availableModels.map(m => (
                                <option key={m.id} value={m.id}>{m.name || m.id}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                )}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-6" ref={scrollRef}>
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-70">
                        <div className="h-12 w-12 rounded-full bg-[#0073ea]/10 flex items-center justify-center">
                            <Bot className="h-6 w-6 text-[#0073ea]" />
                        </div>
                        <div className="max-w-[280px]">
                            <p className="text-sm font-medium">Hello there!</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                I can analyze your Monday.com boards and provide real-time insights. Try asking about your latest deals or open work orders.
                            </p>
                        </div>
                    </div>
                )}

                {messages.map((m: Message) => {
                    const hasText = m.content && m.content.trim() !== '';
                    const hasTools = m.toolInvocations && m.toolInvocations.length > 0;

                    // Hide completely blank intermediate ghosts
                    if (m.role === 'assistant' && !hasText && !hasTools) {
                        return null;
                    }
                    
                    return (
                        <div key={m.id} className="flex flex-col w-full gap-4">
                            {/* WhatsApp-style System Message for Tool Invocations */}
                            {hasTools && (
                                <div className="flex flex-col items-center justify-center w-full gap-2 my-2">
                                    {m.toolInvocations?.map(tool => (
                                        <div key={tool.toolCallId} className="px-3 py-1 bg-muted border border-border/40 rounded-full text-[10px] text-muted-foreground shadow-sm flex items-center gap-1.5 backdrop-blur-sm mx-auto w-fit">
                                            <span className="animate-[spin_3s_linear_infinite] text-[10px]">⚙️</span> 
                                            System: Executed {tool.toolName}
                                        </div>
                                    ))}
                                    
                                    {/* Fallback if model halted stream */}
                                    {!hasText && (
                                        <div className="px-3 py-1 bg-muted/40 border border-border/30 rounded-full text-[10px] text-muted-foreground/70 shadow-sm mx-auto w-fit opacity-80">
                                            ⚠️ Connection to model stream ended before summarizing
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Standard Chat Bubble Layout */}
                            {hasText && (
                                <div className={cn("flex gap-3 max-w-[85%] break-words w-fit", m.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto")}>
                                    {m.role === 'assistant' && (
                                        <div className="h-8 w-8 shrink-0 rounded-full bg-[#0073ea]/10 flex items-center justify-center mt-1">
                                            <Bot className="h-4 w-4 text-[#0073ea]" />
                                        </div>
                                    )}

                                    {m.role === 'user' && (
                                        <div className="h-8 w-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center mt-1">
                                            <User className="h-4 w-4 text-primary" />
                                        </div>
                                    )}

                                    <div className="space-y-2 flex flex-col max-w-full">
                                        <div
                                            className={cn(
                                                "px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed shadow-sm break-words overflow-x-hidden",
                                                m.role === 'user'
                                                    ? "bg-[#0073ea] text-white rounded-tr-sm"
                                                    : "bg-muted/50 text-foreground border border-border/50 rounded-tl-sm"
                                            )}
                                        >
                                            {m.content}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
            })}

                {isLoading && (
                    <div className="flex gap-3 max-w-[85%] mr-auto animate-pulse">
                        <div className="h-8 w-8 shrink-0 rounded-full bg-[#0073ea]/10 flex items-center justify-center mt-1">
                            <Bot className="h-4 w-4 text-[#0073ea]" />
                        </div>
                        <div className="px-4 py-3 rounded-2xl text-sm bg-muted/50 border border-border/50 rounded-tl-sm flex items-center gap-1.5">
                            <div className="h-1.5 w-1.5 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="h-1.5 w-1.5 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="h-1.5 w-1.5 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                )}
                
                {error && (
                    <div className="flex gap-3 max-w-[85%] mr-auto">
                        <div className="h-8 w-8 shrink-0 rounded-full bg-[#0073ea]/10 flex items-center justify-center mt-1">
                            <Bot className="h-4 w-4 text-[#0073ea]" />
                        </div>
                        <div className="space-y-2 flex flex-col max-w-full">
                            <div className="px-4 py-3 rounded-2xl text-sm text-red-400 bg-red-950/20 border border-red-900/50 rounded-tl-sm break-words overflow-x-hidden">
                                [System Stream Error]: {error.message || String(error)}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-card/60 border-t backdrop-blur-md">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSubmit(e);
                    }}
                    className="relative flex items-center"
                >
                    <Input
                        value={input}
                        onChange={handleInputChange}
                        placeholder="Ask about your Monday.com data..."
                        className="pl-4 pr-12 py-6 rounded-full bg-background border-muted-foreground/20 focus-visible:ring-[#0073ea]"
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={isLoading || !input.trim()}
                        className="absolute right-1.5 h-9 w-9 rounded-full bg-[#0073ea] hover:bg-[#0073ea]/90 text-white transition-all shadow-md"
                    >
                        <Send className="h-4 w-4 ml-0.5" />
                    </Button>
                </form>
                <div className="mt-2 flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                    <ShieldAlert className="h-3 w-3" />
                    <span>BI-Bot can make mistakes. Verify important metrics.</span>
                </div>
            </div>
        </Card>
    );
}
