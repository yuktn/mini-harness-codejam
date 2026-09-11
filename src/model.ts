import "dotenv/config";

//for debugging purposes
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

type ProviderModels = {
    openai:
    | "gpt-5.6-sol"
    | "gpt-5.6-terra"
    | "gpt-5.6-luna"
    ,
    anthropic:
    | "claude-haiku-4-5" //TODO: not official, i dont have time to sign up to platform

}

type ChatMessage = {
    role: "user" | "assistant" | "system";
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

const openAIClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});



//Start real model handling

export async function requestMessage(provider: Provider, model: Model<Provider>, input: ChatMessage[]): Promise<ChatMessage> {

    if (provider === 'openai') {
        const response = await openAIClient.responses.create({
            model,
            input
        });

        const assistantResponse: ChatMessage = {
            role: "assistant",
            content: response.output_text
        }

        return assistantResponse
    }

    if (provider === 'anthropic') {
        const response = await anthropicClient.messages.create({
            model,
            max_tokens: 1000, // custom
            messages: input
        })

        for (const block of response.content) {
            if (block.type === "text") {
                const assistantResponse: ChatMessage = {
                    role: "assistant",
                    content: block.text
                }

                return assistantResponse
            }
        }
    }

    return {
        role: "assistant",
        content: "Malformed request, provider not supported"
    }
}

//lets debug

console.log("Debugging...");

async function debug() {

    const customProvider: Provider = "anthropic" 
    const customModel: Model<Provider> = "claude-haiku-4-5"

    const rl = readline.createInterface({ input, output });

    let graahh: ChatMessage[] = [];

    while (true) {

        const inputString: string = await rl.question('input your string? ');

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