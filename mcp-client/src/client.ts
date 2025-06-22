import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import dotenv from "dotenv";

dotenv.config();

const client = new MultiServerMCPClient({
	throwOnLoadError: true,
	prefixToolNameWithServerName: true,
	additionalToolNamePrefix: "mcp",
	useStandardContentBlocks: true,

	mcpServers: {
		AlgoTrade: {
			transport: "http",
			url: "http://localhost:3000/sse",
		},
	},
});

const API_KEY = process.env.API_KEY;

async function main() {

	const tools = await client.getTools();

	console.log(tools)

	const model = new ChatGoogleGenerativeAI({
		model: "gemini-2.0-flash",
		temperature: 0,
		maxRetries: 2,
		apiKey:API_KEY
	});


	const agent = createReactAgent({
		llm: model,
		tools,
	});

	try {
		const mathResponse = await agent.invoke({
			messages: [{ role: "user", content: "What are my current Positions?" }],
		});
		console.log(mathResponse);
	} catch (error) {
		console.error("Error during agent execution:", error);
	}

	await client.close();
}

main();