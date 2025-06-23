import { NextRequest } from 'next/server';
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";

const client = new MultiServerMCPClient({
    throwOnLoadError: false,
    prefixToolNameWithServerName: true,
    additionalToolNamePrefix: "mcp",
    useStandardContentBlocks: true,
    mcpServers: {
        AlgoTrade: {
            transport: "sse" as const,
            url: "http://localhost:3000/sse",
        },
    },
});

let agent: any = null;
const API_KEY = process.env.API_KEY;

async function initializeAgent() {
    if (agent) return agent;
    
    try {
        const tools = await client.getTools();
        console.log("MCP tools loaded:", tools.map(t => t.name));
        
        const model = new ChatGoogleGenerativeAI({
            model: "gemini-2.0-flash",
            temperature: 0,
            maxRetries: 2,
            apiKey: API_KEY
        });

        agent = createReactAgent({
            llm: model,
            tools,
        });

        return agent;
    } catch (error) {
        console.error("Failed to initialize MCP agent:", error);
        throw error;
    }
}

export async function POST(request: NextRequest) {
    try {
        const { message, history = [] } = await request.json();
		
		if (!message) {
            return Response.json({ error: 'Message is required' }, { status: 400 });
        }

        const mcpAgent = await initializeAgent();

		const fullConversation = [
            ...history,
            { role: "user", content: message }
        ];

        const response = await mcpAgent.invoke({
            messages: fullConversation,
        });

        const finalMessage = response.messages[response.messages.length - 1];
        
        return Response.json({ 
            response: finalMessage.content,
            success: true 
        });

    } catch (error) {
        console.error("Chat API error:", error);
        return Response.json({ 
            error: 'Failed to process message',
            success: false 
        }, { status: 500 });
    }
}