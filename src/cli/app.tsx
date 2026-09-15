import React, { useState } from "react";
import { Text, Box } from "ink";
import TextInput from "ink-text-input";
import { requestMessage, generatorRequestMessage } from "../model.js";
import type { ChatMessage, AgentEvent, streamAgentEvent } from "../model.js";

export default function App() {
    const [query, setQuery] = useState('');
    const [generator, setGenerator] = useState(true)
    const [messageStream, setMessageStream] = useState('')
    const [messageList, setMessageList] = useState<ChatMessage[]>([])
    const [status, setStatus] = useState<string | null>(null);
    const [streaming, setStreaming] = useState(false)

    async function submitHandler() {
        if (query === '') return;

        const messages = [...messageList, { role: "user", content: query }]

        setMessageList(messageList => [...messageList, { role: "user", content: query } as ChatMessage])

        setQuery('')

        if (generator === false) {
            const finalMessage = await requestMessage('openai', 'gpt-5.6-luna', messages as ChatMessage[],
                event => {
                    if (event.type === "thinking_start") {
                        setStatus("Thinking...")
                    } else if (event.type === "tool_start") {
                        if (event.tool === "web_search") {
                            setStatus("Searching the web for " + event.args)
                        } else if (event.tool === "web_visit") {
                            setStatus("Visiting " + event.args + " to get more info")
                        }
                    } else if (event.type === "thinking_end") {
                        setStatus(null)
                    }
                    setMessageList(messageList => [...messageList, finalMessage])
                }
            )
        } else {
            setStatus("Thinking...")

            const generator = generatorRequestMessage(
                "openai",
                "gpt-5.6-luna",
                messages as ChatMessage[]
            );

            while (true) {
                const { value, done } = await generator.next();

                if (done) {
                    setMessageList(prev => [
                        ...prev,
                        value
                    ]);

                    break;
                }

                switch (value.type) {
                    case "start":
                        setStatus("Thinking...");
                        setStreaming(true)
                        break;

                    case "text_delta":
                        setMessageStream(prev =>
                            prev + value.text
                        );
                        break;

                    case "tool_start":
                        if (value.tool === "web_search") {
                            setStatus(
                                `Searching the web for ${value.args}`
                            );
                        }

                        if (value.tool === "web_visit") {
                            setStatus(
                                `Visiting ${value.args} to get more info`
                            );
                        }

                        break;

                    case "finish":
                        setStatus(null);
                        setMessageStream('')
                        setStreaming(false)
                        break;
                }
            }
        }
    }

    return (
        <Box flexDirection="column">
            <Box flexDirection="column">
                {messageList.map((message, index) => (
                    <Box key={index} marginY={1}>
                        <Text color="cyan">{message.role}</Text>
                        <Text color="gray"> - </Text>
                        <Text color="blackBright">{message.content}</Text>
                    </Box>
                ))}
                {(streaming) && <Text color="blackBright">
                    <Text color="cyan">assistant</Text>
                    <Text color="gray"> - </Text>
                    <Text color="blackBright">{messageStream}</Text>
                </Text>}
            </Box>

            {status && (
                <Box>
                    <Text color="yellow">{status}</Text>
                </Box>
            )}

            <Box>
                <Box marginRight={1}>
                    <Text>Enter your query:</Text>
                </Box>

                <TextInput
                    value={query}
                    onSubmit={submitHandler}
                    onChange={setQuery}
                />
            </Box>
        </Box>
    );
};