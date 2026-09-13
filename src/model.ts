import "dotenv/config";

//for debugging purposes
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

import { openAiTools, anthropicTools } from "./tools/tools.js";
import { webSearch, webVisit } from "./tools/webtools.js"

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

type ChatMessage = {
    role: "user" | "assistant" | "system" | "developer";
    content: string;
}

type Provider = keyof ProviderModels;

type Model<P extends Provider> = ProviderModels[P];

// Anthropic

import Anthropic from "@anthropic-ai/sdk";

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

export async function requestMessage(provider: Provider, model: Model<Provider>, input: ChatMessage[]): Promise<ChatMessage> {

    if (provider === "openai") {
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
                        result = await webSearch(args.query);
                        break;

                    case "web_visit":
                        result = await webVisit(args.siteUrl);
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

    // TODO: Should make a function that converts my ChatMessage (OpenAI's) with Anthropic's (Doesn't support 'developer') alright, amodei.
    // oh and should implement tool call logic for Anthropic, but i guess it'll be similar with OpenAI's.
    // like check if it the tool call request is there, if not, just return the value.
    // and change status and wow. just like that i made my own harness.
    // I should give it bash and file read as well but yeah.
    // and use Ink to make it a CLI like real harnesses. REAL harnesses.
    // im having too much fun writing this todo.
    // 26/09/13, ill be back.


    // if (provider === 'anthropic') {
    //     const response = await anthropicClient.messages.create({
    //         model,
    //         max_tokens: 1000, // custom
    //         messages: input,
    //         tools: anthropicTools
    //     })

    //     for (const block of response.content) {
    //         if (block.type === "text") {
    //             const assistantResponse: ChatMessage = {
    //                 role: "assistant",
    //                 content: block.text
    //             }

    //             return assistantResponse
    //         }
    //     }
    // }

    return {
        role: "assistant",
        content: "Malformed request, provider not supported"
    }
}

//lets debug

console.log("Debugging...");

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

debug();