import Anthropic from "@anthropic-ai/sdk";

const openAiTools = [
  {
    type: "function" as const,
    name: "web_search",
    description: "Input a query to get search results and API. Pair with web_visit to give detailed results.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "A query you want to search.",
        },
      },
      required: ["query"],
      additionalProperties: false,
    },
    strict: true,
  },
    {
    type: "function" as const,
    name: "web_visit",
    description: "Send a crawler to url and get a Markdown result. Pair with web_search to get the url.",
    parameters: {
      type: "object",
      properties: {
        siteUrl: {
          type: "string",
          description: "The url of the site you want to crawl.",
        },
      },
      required: ["siteUrl"],
      additionalProperties: false,
    },
    strict: true,
  }
];

const anthropicTools: Anthropic.Tool[] = [
  {
    name: "web_search",
    description:
      "Input a query to get search results and API. Pair with web_visit to give detailed results.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "A query you want to search.",
        },
      },
      required: ["query"],
      additionalProperties: false,
    },
  },
  {
    name: "web_visit",
    description:
      "Send a crawler to URL and get a Markdown result. Pair with web_search to get the URL.",
    input_schema: {
      type: "object",
      properties: {
        siteUrl: {
          type: "string",
          description: "The URL of the site you want to crawl.",
        },
      },
      required: ["siteUrl"],
      additionalProperties: false,
    },
  },
];

export { openAiTools, anthropicTools };