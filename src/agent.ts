//Here goes nothing..

import { requestMessage } from "./model.js";

const response = await requestMessage("openai", "gpt-5.6-luna", [{role: "user", content: "search for the webtoon 아리도록 and give me details"}])

console.log(response)