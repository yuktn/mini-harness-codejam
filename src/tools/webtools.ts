//Use Brave Search LLM Context API to give Model Agnostic Search Tool

import "dotenv/config";

export async function webSearch(query: string) {
    const url = `https://api.search.brave.com/res/v1/llm/context?q=${query}`

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Subscription-Token': process.env.BRAVE_API_KEY as string // Your custom header here
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log(data);

        return data;
    } catch (error) {
        console.error('Request failed:', error);
    }

    return 'Error while Web Search Tool'
}

//Use Firecrawl to Scrape Web

export async function webVisit(siteUrl: string) {
    const url = 'https://api.firecrawl.dev/v2/scrape';
    const options = {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "onlyMainContent": true,
            "url": siteUrl,
            "parsers": [
                "pdf"
            ],
            "formats": [
                "markdown"
            ]
        })
    };

    try {
        const response = await fetch(url, options);
        const data = await response.json();
        console.log(data);
        return data;
    } catch (error) {
        console.error(error);
    }
}

