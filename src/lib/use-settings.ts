import { useState, useEffect } from 'react';

export type ProviderType = 'google' | 'openai' | 'anthropic' | 'openrouter';

export interface AppSettings {
  provider: ProviderType;
  apiKey: string;
  model: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  provider: 'google',
  apiKey: '',
  model: 'gemini-1.5-pro',
};

const SETTINGS_KEY = 'bi_bot_settings';

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);

  // Load from localStorage on client-side initialization
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        setSettings(JSON.parse(stored));
      } else {
        setSettings(DEFAULT_SETTINGS);
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
      setSettings(DEFAULT_SETTINGS);
    }
  }, []);

  const saveSettings = (newSettings: Partial<AppSettings>) => {
    try {
      const updated = { ...settings, ...newSettings } as AppSettings;
      setSettings(updated);
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  };

  return {
    settings,
    saveSettings,
    isLoading: settings === null,
  };
}
