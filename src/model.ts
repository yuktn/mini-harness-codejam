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
    | "fable-5.1" //TODO: not official, i dont have time to sign up to platform

}

type ChatMessage = {
    role: "user" | "assistant" | "system";
    content: string;
}

type Provider = keyof ProviderModels;

type Model<P extends Provider> = ProviderModels[P];

// Anthropic



// OpenAI

import OpenAI from "openai";

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});



//Start real model handling

export async function requestMessage(provider: Provider, model: Model<Provider>, input: ChatMessage[]): Promise<ChatMessage> {

    if (provider === 'openai') {
        const response = await client.responses.create({
            model,
            input
        });

        const newResponse: ChatMessage = {
            role: "assistant",
            content: response.output_text
        }

        return newResponse
    }

    return {
        role: "assistant",
        content: "Malformed request, provider not supported"
    }
}

//lets debug

console.log("Debugging...");

async function debug() {

    const rl = readline.createInterface({ input, output });

    let graahh: ChatMessage[] = [];

    while (true) {

        const inputString: string = await rl.question('input your string? ');

        const newInputIncome: ChatMessage = {
            role: "user",
            content: inputString
        }

        graahh.push(newInputIncome);

        await requestMessage("openai", "gpt-5.6-sol", 
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