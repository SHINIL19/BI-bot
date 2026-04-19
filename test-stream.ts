import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testFetch() {
  const res = await fetch("http://localhost:3000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [{ role: 'user', content: "How's our pipeline looking for the energy sector this quarter?" }],
      settings: { provider: 'openrouter', model: 'openrouter/auto', apiKey: process.env.OPENROUTER_API_KEY || '' }
    })
  });

  if (!res.ok) {
    console.error("HTTP ERROR:", res.status, await res.text());
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) return;
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    console.log("CHUNK:", decoder.decode(value));
  }
}

testFetch();
