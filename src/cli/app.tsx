import React, { useState } from "react";
import { Text, Box } from "ink";
import TextInput from "ink-text-input";
import { requestMessage } from "../model.js";
import type { ChatMessage } from "../model.js";

export default function App() {
    const [query, setQuery] = useState('');
    const [messageList, setMessageList] = useState<ChatMessage[]>([])

    async function submitHandler() {
        if (query === '') return;

        setMessageList(messageList => [...messageList, { role: "user", content: query } as ChatMessage])

        setQuery('')

        const finalMessage = await requestMessage('openai', 'gpt-5.6-luna', messageList)


        setMessageList(messageList => [...messageList, finalMessage])
    }

    return (
        <Box>
            <Box flexDirection="column">
                {messageList.map((message) => (
                    <Box marginY={1}>
                        <Text color="cyan">{message.role}</Text>
                        <Text color="gray"> - </Text>
                        <Text color="blackBright">
                            {message.content}
                        </Text>
                    </Box>
                ))}
            </Box>

            <Box marginRight={1}>
                <Text>Enter your query:</Text>
            </Box>

            <TextInput value={query} onSubmit={submitHandler} onChange={setQuery} />
        </Box>
    );
};