import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

const transport = new SSEClientTransport(
  new URL("http://localhost:3000/sse")
);
const client = new Client({ name: "test-client", version: "1.0.0" }, {
  capabilities: {}
});

async function main() {
  try {
    // Connect to the server (returns undefined on success)
    await client.connect(transport);
    console.log("Connected to MCP server successfully!");
    
    // Test the connection by listing available tools
    const tools = await client.listTools();
    console.log("Available tools:", tools);

  } catch (error) {
    console.error("Connection failed");
    console.error("Full error:", error);
  }
}

main();