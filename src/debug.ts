// for debugging purposes, Thanks ChatGPT!

import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import {
    generatorRequestMessage
} from "./model.js";

import type {
    Provider,
    Model,
    ChatMessage,
    AgentEvent,
    streamAgentEvent
} from "./model.js";


// Writes model deltas only when a complete "word" has arrived.
// Streaming APIs can give you chunks like:
//
// "Hel"
// "lo "
// "wor"
// "ld"
//
// This converts that into:
//
// "Hello "
// "world"
//
function createWordWriter() {
    let buffer = "";

    return {
        write(text: string) {
            buffer += text;

            // Emit everything through the last whitespace character.
            // Keep the unfinished final word in the buffer.
            const lastWhitespace = Math.max(
                buffer.lastIndexOf(" "),
                buffer.lastIndexOf("\n"),
                buffer.lastIndexOf("\t")
            );

            if (lastWhitespace !== -1) {
                const ready = buffer.slice(0, lastWhitespace + 1);
                buffer = buffer.slice(lastWhitespace + 1);

                output.write(ready);
            }
        },

        flush() {
            if (buffer.length > 0) {
                output.write(buffer);
                buffer = "";
            }
        }
    };
}


function printAgentEvent(event: AgentEvent) {
    switch (event.type) {
        case "thinking_start":
            output.write("\n[thinking started]\n");
            break;

        case "tool_start":
            output.write(
                `\n[tool started: ${event.tool}` +
                (event.args ? ` | ${event.args}` : "") +
                "]\n"
            );
            break;

        case "tool_end":
            output.write(
                `\n[tool finished: ${event.tool}]\n`
            );
            break;

        case "thinking_end":
            output.write("\n[thinking finished]\n");
            break;
    }
}


async function debug() {
    const customProvider: Provider = "openai";
    const customModel: Model<Provider> = "gpt-5.6-terra";

    const rl = readline.createInterface({
        input,
        output
    });

    const messages: ChatMessage[] = [];

    console.log("Agent debugger");
    console.log('Type "quit" to exit.\n');

    try {
        while (true) {
            const inputString = await rl.question("you> ");

            if (inputString.trim().toLowerCase() === "quit") {
                break;
            }

            if (!inputString.trim()) {
                continue;
            }

            const userMessage: ChatMessage = {
                role: "user",
                content: inputString
            };

            messages.push(userMessage);

            output.write("\nassistant> ");

            const wordWriter = createWordWriter();

            try {
                const generator = generatorRequestMessage(
                    customProvider,
                    customModel,
                    messages,
                    printAgentEvent
                );

                let assistantMessage: ChatMessage | undefined;

                //
                // Don't use:
                //
                //     for await (const event of generator)
                //
                // here, because we also want the generator's
                // final `return` value.
                //
                while (true) {
                    const next = await generator.next();

                    if (next.done) {
                        assistantMessage = next.value;
                        break;
                    }

                    const event = next.value;

                    switch (event.type) {
                        case "text_delta":
                            wordWriter.write(event.text);
                            break;

                        case "tool_start":
                            wordWriter.flush();

                            output.write(
                                `\n[stream tool started: ${event.tool}` +
                                (event.args ? ` | ${event.args}` : "") +
                                "]\n"
                            );

                            break;

                        case "tool_end":
                            wordWriter.flush();

                            output.write(
                                `\n[stream tool finished: ${event.tool}]\n`
                            );

                            break;

                        case "finish":
                            wordWriter.flush();
                            output.write("\n[stream finished]\n");
                            break;

                        case "error":
                            wordWriter.flush();
                            console.error(
                                "\n[stream error]",
                                event.error
                            );
                            break;
                    }
                }

                wordWriter.flush();
                output.write("\n\n");

                if (assistantMessage) {
                    messages.push(assistantMessage);
                }

            } catch (error) {
                wordWriter.flush();

                console.error("\nAgent request failed:");

                if (error instanceof Error) {
                    console.error(error.stack ?? error.message);
                } else {
                    console.error(error);
                }

                console.log();
            }
        }
    } finally {
        rl.close();
    }

    console.log("\nDebugger closed.");
}


debug().catch(error => {
    console.error("Fatal debugger error:", error);
    process.exitCode = 1;
});