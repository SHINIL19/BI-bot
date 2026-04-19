async function test() {
    console.log("Posting to /api/chat locally...");
    const res = await fetch("http://localhost:3000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            messages: [{ role: "user", content: "How's our pipeline looking for the energy sector this quarter?" }],
            settings: {
                provider: "openrouter",
                model: "openrouter/auto",
                apiKey: "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"
            }
        })
    });

    if (!res.ok) {
        console.error("HTTP Error:", res.status, await res.text());
        return;
    }

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let result = "";

    while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        console.log("--- CHUNK RECIEVED ---");
        console.log(chunk);
        result += chunk;
    }
    
    console.log("\n--- STREAM COMPLETE. ENDING SCRIPT ---");
}

test();
