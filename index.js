import OpenAI from "openai";
import readlineSync from "readline-sync";
import dotenv from 'dotenv'
dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

function getWeatherDetails(city = "") {
  if (city.toLowerCase() === "pune") return "10°C";
  if (city.toLowerCase() === "mumbai") return "40°C";
  if (city.toLowerCase() === "benguluru") return "20°C";
  if (city.toLowerCase() === "delhi") return "25°C";
}

const tools = {
    "getWeatherDetails": getWeatherDetails
}

const SYSTEM_PROMPT = `
    You are an AI Assistant with START, PLAN, ACTION, Observation and Output State.
    Wait for the user prompt and first PLAN using available tools.
    After planning Take the action with appropriate tools and wait for Observation based on Action.
    Once you get the obeservation, Return the AI response based on START prompt and observations

    Stricitly follow the JSON output format as in examples

    Available Tools:
    - function getWeatherDetails(city: string): string
    getWeatherDetails is a function that accepts city name as string and returns the weather details

    Example:
    START
    {"type": "user", "user":"What is the sum of weather of Pune and Mumbai?" }
    {"type": "plan", "plan":"I will call the getWeatherDetails for Pune" }
    {"type": "action", "function":"getWeatherDetails", "input":"Pune" }
    {"type": "observation", "observation":"10°C" }
    {"type": "plan", "plan":"I will call getWeatherDetails for Mumbai" }
    {"type": "action", "function":"getWeatherDetails", "input":"Mumbai"  }
    {"type": "observation", "observation":"40°C" }
    {"type": "output", "output":"The sum of weather of Pune and Mumbai is 50°C" }
`;

const messages = [{ role: "system", content: SYSTEM_PROMPT }];

while (true) {
  const query = readlineSync.question(">> ");
  const q = {
    type: "user",
    user: query,
  };
  messages.push({'role':'user', content: JSON.stringify(q)});

  while(true){
    const chat = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: messages,
        response_format: {type: "json_object"}
    })

    const result = chat.choices[0].message.content;
    messages.push({role: 'assistant', content:result})

    console.log(`\n\n----------------------------------- START AI ---------------------------------`)
    console.log(result)
    console.log(`----------------------------------- END AI ---------------------------------\n\n`)

    const call = JSON.parse(result);

    if(call.type == 'output'){
        console.log(`Bot: ${call.output}`)
        break;
    }
    else if(call.type == 'action'){
        const fn = tools[call.function]
        const obeservation = fn(call.input)
        const obs = {"type": "observation", "observation": obeservation}
        messages.push({role: 'developer', content: JSON.stringify(obs)});
    }
  }
}
