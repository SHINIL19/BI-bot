import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { provider, apiKey } = await req.json();

    if (!provider || !apiKey) {
      return NextResponse.json({ error: 'Provider and API Key required' }, { status: 400 });
    }

    let models: { id: string; name: string }[] = [];

    switch (provider) {
      case 'openai':
        const openaiRes = await fetch('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (!openaiRes.ok) throw new Error('Invalid OpenAI Key or Rate Limit');
        const openaiData = await openaiRes.json();
        models = openaiData.data
          .filter((m: any) => m.id.includes('gpt')) // simple filter for instruct/chat models
          .map((m: any) => ({ id: m.id, name: m.id }))
          .sort((a: any, b: any) => a.id.localeCompare(b.id));
        break;

      case 'google':
        const googleRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        if (!googleRes.ok) throw new Error('Invalid Google Gemini Key');
        const googleData = await googleRes.json();
        models = googleData.models
          .filter((m: any) => m.name.includes('gemini'))
          .map((m: any) => ({
            id: m.name.replace('models/', ''), // Extract actual model id
            name: m.displayName || m.name
          }));
        break;

      case 'anthropic':
        // Anthropic models API requires additional headers and is not fully public in the same way,
        // so we provide the known standard models supported by Vercel AI SDK.
        // If we strictly validate key, we could do a dummy request, but a simple hardcode is safer for UX here.
        models = [
          { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet (Latest)' },
          { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku' },
          { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
          { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet' },
          { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' }
        ];
        break;

      case 'openrouter':
        const orRes = await fetch('https://openrouter.ai/api/v1/models', {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (!orRes.ok) throw new Error('Invalid OpenRouter Key');
        const orData = await orRes.json();
        
        const fetchedModels = (orData.data || [])
          .filter((m: any) => m.id !== 'openrouter/auto' && m.id !== 'auto')
          .map((m: any) => ({ id: m.id, name: m.name || m.id }))
          .sort((a: any, b: any) => a.name.localeCompare(b.name));
          
        models = [
            { id: 'openrouter/auto', name: 'OpenRouter Auto (Best Model)' },
            ...fetchedModels
        ];
        break;

      default:
        return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 });
    }

    return NextResponse.json({ models });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch models' }, { status: 500 });
  }
}
