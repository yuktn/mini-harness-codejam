// OpenAI

//TODO: Replace this with generalized model handling @ model.ts

import "dotenv/config";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const strings: string = Math.random().toString(36).slice(2, 8);

const response = await client.responses.create({
    model: "gpt-5.6-terra",
    input: `Take this string: ${strings} and return the string reversed. Just directly, no other text.`
});

if (response.output_text == strings.split("").reverse().join("")) {
    console.log(`Test passed, ${strings}, ${response.output_text}  ` )
} else {
    console.log(`Test failed, ${strings}, ${response.output_text}  ` )
}