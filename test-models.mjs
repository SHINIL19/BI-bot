import fs from 'fs';

async function listModels() {
    console.log("Fetching models...");
    const env = fs.readFileSync('.env.local', 'utf8');
    const key = env.split('\n').find(line => line.includes('GEMINI_API_KEY') || line.includes('GOOGLE_GENERATIVE_AI_API_KEY'))?.split('=')[1]?.trim();

    if (!key) {
        console.error("No API key found in .env.local");
        return;
    }

    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const data = await res.json();
        console.log("--- V1 BETA ---");
        console.log(data.models?.map(m => m.name).join("\n"));

        const res2 = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${key}`);
        const data2 = await res2.json();
        console.log("\n\n--- V1 ---");
        console.log(data2.models?.map(m => m.name).join("\n"));
    } catch (e) {
        console.error(e);
    }
}
listModels();
