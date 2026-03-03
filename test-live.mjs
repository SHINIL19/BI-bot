import fs from 'fs';

async function testLive() {
    console.log("Pinging https://bi-bot-plum.vercel.app/api/chat...");
    try {
        const response = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                mockMode: false,
                messages: [{
                    role: 'user',
                    content: 'How many work orders are currently marked as Emergency priority? Show the details of these specific orders.'
                }]
            })
        });

        console.log(`HTTP Status: ${response.status}`);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let loop = true;

        while (loop) {
            const { done, value } = await reader.read();
            if (done) {
                console.log("\n\n--- Stream Completed ---");
                break;
            }
            process.stdout.write(decoder.decode(value));
        }
    } catch (err) {
        console.error("Test failed:", err);
    }
}

testLive();
