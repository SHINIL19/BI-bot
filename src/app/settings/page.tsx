"use client";

import { useState } from "react";
import { useSettings, ProviderType } from "@/lib/use-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Save, KeyRound, Server, AlertCircle } from "lucide-react";

export default function SettingsPage() {
  const { settings, saveSettings, isLoading } = useSettings();
  
  const [localProvider, setLocalProvider] = useState<ProviderType>(settings?.provider || 'google');
  const [localKey, setLocalKey] = useState(settings?.apiKey || '');
  const [localModel, setLocalModel] = useState(settings?.model || '');
  
  const [availableModels, setAvailableModels] = useState<{id: string, name: string}[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Sync state initially when hook loads
  if (!isLoading && !localProvider && settings) {
    setLocalProvider(settings.provider);
    setLocalKey(settings.apiKey);
    setLocalModel(settings.model);
  }

  const handleFetchModels = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    if (!localKey) {
      setErrorMsg('Please enter an API key to load models.');
      return;
    }

    setIsFetchingModels(true);
    try {
      const res = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: localProvider, apiKey: localKey })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      setAvailableModels(data.models || []);
      
      // Auto-select first if none selected
      if (data.models && data.models.length > 0 && !data.models.find((m: any) => m.id === localModel)) {
        setLocalModel(data.models[0].id);
      }
      
      setSuccessMsg('Models loaded successfully.');
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to fetch models');
      setAvailableModels([]);
    } finally {
      setIsFetchingModels(false);
    }
  };

  const handleSaveSettings = () => {
    saveSettings({
      provider: localProvider,
      apiKey: localKey,
      model: localModel
    });
    setSuccessMsg('Settings saved successfully!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  if (isLoading) return <div className="p-8">Loading settings...</div>;

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6 w-full">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Configure your LLM provider and model preferences.</p>
      </div>

      <Card className="p-6 space-y-8 bg-card/40 backdrop-blur border-border/50">
        
        {/* Provider Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium flex items-center gap-2">
            <Server className="h-4 w-4" /> Provider
          </label>
          <div className="flex flex-wrap gap-3">
            {[
              { id: 'google', label: 'Google Gemini' },
              { id: 'openai', label: 'OpenAI' },
              { id: 'anthropic', label: 'Anthropic' },
              { id: 'openrouter', label: 'OpenRouter' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => {
                  setLocalProvider(p.id as ProviderType);
                  setAvailableModels([]); // reset models on provider change
                  setLocalModel('');
                }}
                className={`px-4 py-2 rounded-md text-sm transition-all border ${
                  localProvider === p.id 
                    ? 'bg-[#0073ea] text-white border-[#0073ea]' 
                    : 'bg-background hover:bg-muted border-border/50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* API Key */}
        <div className="space-y-3">
          <label className="text-sm font-medium flex items-center gap-2">
            <KeyRound className="h-4 w-4" /> API Key
          </label>
          <div className="flex gap-2">
            <Input 
              type="password"
              placeholder={`Enter your ${localProvider} API key...`}
              value={localKey}
              onChange={(e) => setLocalKey(e.target.value)}
              className="flex-1 font-mono"
            />
            <Button 
              onClick={handleFetchModels}
              disabled={isFetchingModels || !localKey}
              variant="secondary"
            >
              {isFetchingModels ? 'Loading...' : 'Load Models'}
            </Button>
          </div>
        </div>

        {/* Dynamic Model Dropdown */}
        {availableModels.length > 0 && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
            <label className="text-sm font-medium">Select Model</label>
            <select
              value={localModel}
              onChange={(e) => setLocalModel(e.target.value)}
              className="w-full p-2.5 rounded-md bg-background border border-border focus:outline-none focus:ring-2 focus:ring-[#0073ea] text-sm"
            >
              {availableModels.map(m => (
                <option key={m.id} value={m.id}>{m.name || m.id}</option>
              ))}
            </select>
          </div>
        )}

        {errorMsg && (
          <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-md">
            <AlertCircle className="h-4 w-4" /> {errorMsg}
          </div>
        )}
        
        {successMsg && (
          <div className="flex items-center gap-2 text-green-500 text-sm bg-green-500/10 p-3 rounded-md border border-green-500/20">
            {successMsg}
          </div>
        )}

        <div className="pt-4 border-t border-border/50 flex justify-end">
          <Button onClick={handleSaveSettings} className="bg-[#0073ea] hover:bg-[#0073ea]/90 gap-2">
            <Save className="h-4 w-4" /> Save Settings
          </Button>
        </div>
        
      </Card>
    </div>
  );
}
