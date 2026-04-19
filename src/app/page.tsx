"use client";

import { useState, useEffect } from "react";
import { useChat } from '@ai-sdk/react';
import { ChatInterface } from "@/components/chat-interface";
import { ActionTrace, TraceLog } from "@/components/action-trace";
import { useSettings } from "@/lib/use-settings";

export default function DashboardPage() {
  const [logs, setLogs] = useState<TraceLog[]>([]);

  useEffect(() => {
    setLogs([
      {
        id: "init",
        timestamp: new Date(),
        type: "info",
        message: "System initialized. Live backend ready.",
      }
    ]);
  }, []);

  const addLog = (type: TraceLog["type"], message: string, details?: string) => {
    setLogs((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(7),
        timestamp: new Date(),
        type,
        message,
        details,
      },
    ]);
  };

  const { settings } = useSettings();

  const chatHelpers = useChat({
    api: "/api/chat",
    body: {
      settings,
    },
    onResponse: (response) => {
      addLog("info", `Received response streams [Status: ${response.status}]`);
    },
    onFinish: (message) => {
      addLog("success", "AI response completed.");
    },
    onError: (error) => {
      addLog("error", "Failed to fetch response", error.message);
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-7xl h-[calc(100vh-4rem)] md:h-[calc(100vh-6rem)] grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chat Area */}
        <div className="lg:col-span-2 h-full rounded-2xl overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#0073ea]/20 to-transparent opacity-20 group-hover:opacity-30 transition-opacity duration-1000 pointer-events-none" />
          <ChatInterface
            chatHelpers={chatHelpers}
          />
        </div>

        {/* Trace Terminal Area */}
        <div className="h-full hidden lg:block rounded-2xl overflow-hidden relative">
          <ActionTrace logs={logs} />
        </div>
      </div>
    </div>
  );
}
