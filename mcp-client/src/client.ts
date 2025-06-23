import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import dotenv from "dotenv";
import readline from 'readline';

dotenv.config();

const client = new MultiServerMCPClient({
    throwOnLoadError: true,
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

const API_KEY = process.env.API_KEY;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function initializeAgent() {
    try {
        console.log("🔄 Connecting to MCP server...");
        const tools = await client.getTools();
        console.log("✅ MCP server connected successfully!");
        console.log(`📋 Available tools: ${tools.map(t => t.name).join(', ')}`);

		console.log(tools)
        
        const model = new ChatGoogleGenerativeAI({
            model: "gemini-2.0-flash",
            temperature: 0,
            maxRetries: 2,
            apiKey: API_KEY
        });

        const agent = createReactAgent({
            llm: model,
            tools,
        });

        return agent;
    } catch (error) {
        console.error("❌ Failed to initialize agent:", error);
        
        console.log("\n🔍 Troubleshooting steps:");
        console.log("1. Check if your MCP server is running on http://localhost:3000/sse");
        console.log("2. Verify the server supports SSE (Server-Sent Events)");
        console.log("3. Try alternative configurations below\n");
        
        throw error;
    }
}

async function chatWithAgent(agent: any) {
    console.log("\n🤖 AI Trading Assistant is ready!");
    console.log("💡 Try asking: 'What are my current positions?'");
    console.log("📝 Type 'quit' or 'exit' to end the conversation\n");

    const askQuestion = () => {
        rl.question("👤 You: ", async (userInput) => {
            if (userInput.toLowerCase() === 'quit' || userInput.toLowerCase() === 'exit') {
                console.log("👋 Goodbye!");
                rl.close();
                await client.close();
                return;
            }

            if (!userInput.trim()) {
                askQuestion();
                return;
            }

            try {
                console.log("🤖 AI Assistant: Thinking...");
                
                const response = await agent.invoke({
                    messages: [{ role: "user", content: userInput }],
                });

                // Extract the final AI response
                const finalMessage = response.messages[response.messages.length - 1];
                console.log("🤖 AI Assistant:", finalMessage.content);
                console.log(); // Empty line for readability
                
            } catch (error) {
                console.error("❌ Error:", error);
            }
            
            askQuestion();
        });
    };

    askQuestion();
}

interface MCPServerConfig {
    transport: "sse" | "http";
    url: string;
}

interface MCPServersConfig {
    [serverName: string]: MCPServerConfig;
}

interface AlternativeConfig {
    name: string;
    config: MCPServersConfig;
}

const alternativeConfigs: AlternativeConfig[] = [
    {
        name: "SSE Transport",
        config: {
            AlgoTrade: {
                transport: "sse" as const,
                url: "http://localhost:3000/sse",
            }
        }
    },
    {
        name: "HTTP Transport", 
        config: {
            AlgoTrade: {
                transport: "http" as const,
                url: "http://localhost:3000",
            }
        }
    },
];

async function tryAlternativeConfigs(): Promise<MCPServersConfig | null> {
    for (const altConfig of alternativeConfigs) {
        console.log(`\n🔄 Trying ${altConfig.name}...`);
        
        const altClient = new MultiServerMCPClient({
            throwOnLoadError: false, // Don't throw on error for testing
            prefixToolNameWithServerName: true,
            additionalToolNamePrefix: "mcp",
            useStandardContentBlocks: true,
            mcpServers: altConfig.config,
        });

        try {
            const tools = await altClient.getTools();
            console.log(`✅ ${altConfig.name} works! Available tools:`, tools.map(t => t.name));
            await altClient.close();
            return altConfig.config;
        } catch (error) {
            console.log(`❌ ${altConfig.name} failed:`, error);
            await altClient.close();
        }
    }
    
    return null;
}

async function main() {
    try {
        const agent = await initializeAgent();
        await chatWithAgent(agent);
    } catch (error) {
        console.log("\n🔄 Trying alternative configurations...");
        const workingConfig = await tryAlternativeConfigs();
        
        if (workingConfig) {
            console.log("\n✅ Found working configuration! Update your code with:");
            console.log(JSON.stringify(workingConfig, null, 2));
        } else {
            console.log("\n❌ No working configuration found. Please check:");
            console.log("1. MCP server is running on the correct port");
            console.log("2. Server endpoint configuration");
            console.log("3. Network connectivity");
            console.log("4. MCP server supports the transport method (SSE/HTTP)");
        }
    }
}

process.on('SIGINT', async () => {
    console.log('\n👋 Shutting down gracefully...');
    rl.close();
    await client.close();
    process.exit(0);
});

main().catch(console.error);