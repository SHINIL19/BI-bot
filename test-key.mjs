import fs from 'fs';

async function testKey() {
    console.log("Testing new API key directly...");
    const key = 'AIzaSyD-f7tvx0Qaor3yAw0J9L_OxL9B_YhDLtA';

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Hello" }] }]
            })
        });

        console.log(`HTTP Status: ${response.status}`);
        const data = await response.json();
        if (response.status !== 200) {
            console.error("Error from Google:", JSON.stringify(data, null, 2));
        } else {
            console.log("Success! Response:", data.candidates[0].content.parts[0].text);
        }
    } catch (err) {
        console.error("Test failed:", err);
    }
}

testKey();
