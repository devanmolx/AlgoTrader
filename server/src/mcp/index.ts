import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { getPositions } from "../utils/dhan";

const server = new McpServer({
    name: "AlgoTrade",
    version: "1.0.0",
})

server.tool("get Positions", "Get all current positions", async () => {
    try {
        const position = await getPositions();

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(position, null, 2),
                },
            ],
        };
    } catch (error) {
        let errorMessage = "Unknown error occurred";

        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === "string") {
            errorMessage = error;
        } else {
            errorMessage = JSON.stringify(error);
        }

        return {
            content: [
                {
                    type: "text",
                    text: `❌ Error fetching positions: ${errorMessage}`,
                },
            ],
            isError: true,
        };
    }
});


async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("MCP Server running on stdio");
}

main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});

main();