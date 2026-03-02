import { useState } from 'react';

export type Message = {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
};

export function useCustomChat({
    api,
    body,
    onResponse,
    onFinish,
    onError,
}: {
    api: string;
    body?: any;
    onResponse?: (res: Response) => void;
    onFinish?: (msg: Message) => void;
    onError?: (err: Error) => void;
}) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>, options?: { data?: any }) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Math.random().toString(36).substring(7),
            role: 'user',
            content: input,
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        const mergedBody = { ...body, ...options?.data, messages: [...messages, userMessage] };

        try {
            const res = await fetch(api, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(mergedBody),
            });

            if (onResponse) onResponse(res);

            if (!res.ok) {
                throw new Error(await res.text());
            }

            if (!res.body) throw new Error('No response body');

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let done = false;
            let assistantContent = '';

            const assistantMessageId = Math.random().toString(36).substring(7);

            setMessages((prev) => [
                ...prev,
                { id: assistantMessageId, role: 'assistant', content: '' },
            ]);

            while (!done) {
                const { value, done: doneReading } = await reader.read();
                done = doneReading;
                if (value) {
                    const chunkValue = decoder.decode(value);
                    const lines = chunkValue.split('\n');
                    for (const line of lines) {
                        if (line.startsWith('0:')) {
                            try {
                                const textChunk = JSON.parse(line.substring(2));
                                assistantContent += textChunk;
                                setMessages((prev) =>
                                    prev.map(m => m.id === assistantMessageId ? { ...m, content: assistantContent } : m)
                                );
                            } catch (e) {
                                // Ignore parse errors on partial chunks
                            }
                        }
                    }
                }
            }

            if (onFinish) {
                onFinish({ id: assistantMessageId, role: 'assistant', content: assistantContent });
            }

        } catch (error: any) {
            if (onError) onError(error);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        messages,
        input,
        handleInputChange,
        handleSubmit,
        isLoading,
    };
}
