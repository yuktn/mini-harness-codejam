import "dotenv/config";

//for debugging purposes
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

import { openAiTools, anthropicTools } from "./tools/tools.js";
import { webSearch, webVisit } from "./tools/webtools.js"

export type AgentEvent =
    | { type: "thinking_start" }
    | { type: "tool_start"; tool: string, args?: string }
    | { type: "tool_end"; tool: string }
    | { type: "thinking_end" };

type ProviderModels = {
    openai:
    | "gpt-5.6-sol"
    | "gpt-5.6-terra"
    | "gpt-5.6-luna"
    ,
    anthropic:
    | "claude-haiku-4-5"
    | "claude-opus-5"

}

export type ChatMessage = {
    role: "user" | "assistant" | "system" | "developer";
    content: string;
}

type Provider = keyof ProviderModels;

type Model<P extends Provider> = ProviderModels[P];

// Anthropic

import Anthropic from "@anthropic-ai/sdk";
import type {
    MessageParam,
    ContentBlockParam,
    ToolResultBlockParam,
} from "@anthropic-ai/sdk/resources/messages";

const anthropicClient = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});


// OpenAI

import OpenAI from "openai";
import type { ResponseInputItem } from "openai/resources/responses/responses";

const openAIClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});



//Start real model handling

//THIS IS ONE AGENT LOOP. REAL MESSAGE HANDLING WORKS IN AGENT.ts

export async function requestMessage(
    provider: Provider,
    model: Model<Provider>,
    input: ChatMessage[],
    onEvent?: (event: AgentEvent) => void
): Promise<ChatMessage> {

    if (provider === "openai") {
        onEvent?.({
            type: "thinking_start"
        });

        let response = await openAIClient.responses.create({
            model,
            input,
            tools: openAiTools,
        });

        while (true) {
            const calls = response.output.filter(
                (item): item is OpenAI.Responses.ResponseFunctionToolCall =>
                    item.type === "function_call"
            );

            if (calls.length === 0) {
                console.log(response.output_text)
                onEvent?.({
                    type: "thinking_end"
                });
                return {
                    role: "assistant",
                    content: response.output_text,
                };
            }

            const toolOutputs: ResponseInputItem[] = [];

            for (const call of calls) {
                const args = JSON.parse(call.arguments);

                let result: unknown;

                switch (call.name) {
                    case "web_search":
                        onEvent?.({
                            type: "tool_start",
                            tool: "web_search",
                            args: args.query
                        });

                        console.log("Agent requested web search for: " + args.query)
                        result = await webSearch(args.query);

                        onEvent?.({
                            type: "tool_end",
                            tool: "web_search"
                        })
                        break;

                    case "web_visit":
                        onEvent?.({
                            type: "tool_start",
                            tool: "web_visit",
                            args: args.siteUrl
                        });
                        console.log("Agent requested web visit for: " + args.siteUrl)
                        result = await webVisit(args.siteUrl);

                        onEvent?.({
                            type: "tool_end",
                            tool: "web_visit"
                        })
                        break;

                    default:
                        throw new Error(`Unknown tool: ${call.name}`);
                }

                toolOutputs.push({
                    type: "function_call_output",
                    call_id: call.call_id,
                    output:
                        typeof result === "string"
                            ? result
                            : JSON.stringify(result),
                });
            }

            response = await openAIClient.responses.create({
                model,
                previous_response_id: response.id,
                input: toolOutputs,
                tools: openAiTools,
            });
        }
    }

    //OK SO I REALIZED I SHOULD MAKE A WHOLE AGENT LOOP WORK AND ADD OTHER ADAPTERS SO I'LL DO THAT WAY

    // if (provider === 'anthropic') {

    //   //anthropic's messageParam doesn't support developer role -> change to system
    //  input.forEach(message => {
    //       if (message.role === "developer") {
    //             message.role = "system";
    //         }
    //   });
    //     let response = await anthropicClient.messages.create({
    //         model,
    //         max_tokens: 1000, // custom
    //         messages: input as MessageParam[],
    //         tools: anthropicTools
    //     })

    //     while (true) {
    //         const calls = response.content.filter(
    //             (block): block is Anthropic.ToolUseBlock =>
    //                 block.type === "tool_use"
    //         );

    //         if (calls.length === 0) {
    //             for (const block of response.content) {
    //                 if (block.type === "text") {
    //                     const assistantResponse: ChatMessage = {
    //                         role: "assistant",
    //                         content: block.text
    //                     }

    //                     return assistantResponse
    //                 }
    //             }
    //         }

    //         for (const call of calls) {
    //             let result: unknown;

    //             switch (call.name) {
    //                 case "web_search": {
    //                     const input = call.input as { query?: string };
    //                     if (typeof input.query !== "string") {
    //                         throw new Error("Missing siteUrl for web_visit");
    //                     }
    //                     result = await webSearch(input.query);
    //                     break;
    //                 }

    //                 case "web_visit": {
    //                     const input = call.input as { siteUrl?: string };
    //                     if (typeof input.siteUrl !== "string") {
    //                         throw new Error("Missing siteUrl for web_visit");
    //                     }
    //                     result = await webVisit(input.siteUrl);
    //                     break;
    //                 }

    //                 default:
    //                     throw new Error(`Unknown tool: ${call.name}`);
    //             }

    //             input.push(
    //                 { role: "assistant", content: response.content },
    //                 {
    //                     role: "user",
    //                     content: [{ type: "tool_result", tool_use_id: call.id, content: result as string }]
    //                 });
    //         }

    //         response = await anthropicClient.messages.create({
    //             model,
    //             messages: toolOutputs,
    //             tools: anthropicTools,
    //         });
    //     }
    // }

    return {
        role: "assistant",
        content: "Malformed request, provider not supported"
    }
}

//lets debug

async function debug() {

    const customProvider: Provider = "openai"
    const customModel: Model<Provider> = "gpt-5.6-terra"

    const rl = readline.createInterface({ input, output });

    let graahh: ChatMessage[] = [];

    while (true) {

        const inputString: string = await rl.question('input your string? ');

        if (inputString === "quit") break;

        const newInputIncome: ChatMessage = {
            role: "user",
            content: inputString
        }

        graahh.push(newInputIncome);

        await requestMessage(customProvider, customModel,
            graahh
        ).then((response) => {
            console.log(response);
            graahh.push(response);
        }).catch((error) => {
            console.error(error);
        });
    }
}