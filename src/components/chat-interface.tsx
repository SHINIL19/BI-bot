"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Send, Bot, User, ShieldAlert, Zap } from "lucide-react";

interface ChatInterfaceProps {
    chatHelpers: any;
    isMockMode: boolean;
    setIsMockMode: (checked: boolean) => void;
    className?: string;
}

export function ChatInterface({
    chatHelpers,
    isMockMode,
    setIsMockMode,
    className
}: ChatInterfaceProps) {
    const { messages, input, handleInputChange, handleSubmit, isLoading } = chatHelpers;
    const scrollRef = useRef<HTMLDivElement>(null);

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
                    <p className="text-xs text-muted-foreground">Executive Data Assistant</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            Mock Data
                        </span>
                        <Switch
                            checked={isMockMode}
                            onCheckedChange={setIsMockMode}
                            className="data-[state=checked]:bg-[#0073ea]"
                        />
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6" ref={scrollRef}>
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

                {messages.map((m) => (
                    <div key={m.id} className={cn("flex gap-3 max-w-[85%]", m.role === 'user' ? "ml-auto" : "mr-auto")}>
                        {m.role === 'assistant' && (
                            <div className="h-8 w-8 shrink-0 rounded-full bg-[#0073ea]/10 flex items-center justify-center mt-1">
                                <Bot className="h-4 w-4 text-[#0073ea]" />
                            </div>
                        )}

                        <div className="space-y-2">
                            <div
                                className={cn(
                                    "px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed shadow-sm",
                                    m.role === 'user'
                                        ? "bg-[#0073ea] text-white rounded-tr-sm"
                                        : "bg-muted/50 text-foreground border border-border/50 rounded-tl-sm"
                                )}
                            >
                                {m.content}
                            </div>

                            {/* Optional Data Confidence Note rendering logic could go here based on annotations later */}
                        </div>

                        {m.role === 'user' && (
                            <div className="h-8 w-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center mt-1">
                                <User className="h-4 w-4 text-primary" />
                            </div>
                        )}
                    </div>
                ))}

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
            </div>

            {/* Input Area */}
            <div className="p-4 bg-card/60 border-t backdrop-blur-md">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        // Optional: inject custom mock handling here if in mock mode,
                        // otherwise hand off to Vercel AI SDK
                        if (isMockMode) {
                            const syntheticSubmitEvent = e as React.FormEvent<HTMLFormElement>;
                            handleSubmit(syntheticSubmitEvent, { data: { mock: true } });
                        } else {
                            handleSubmit(e);
                        }
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
