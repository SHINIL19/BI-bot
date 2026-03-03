import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

const google = createGoogleGenerativeAI({
    apiKey: "AIzaSyDvVJv5HYN_3yi2rjwX42VTBSqGACxHsK4",
});

async function main() {
    try {
        console.log("Testing gemini-2.0-flash-lite...");
        const { text } = await generateText({
            model: google('gemini-2.0-flash-lite'),
            prompt: 'Write a vegetarian lasagna recipe for 4 people.',
        });
        console.log("Success:\n", text);
    } catch (e) {
        console.error("Failed:", e.message);
    }
}

main();
