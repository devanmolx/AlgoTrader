import express from "express"
import cors from "cors"
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { getPositions } from "./utils/dhan";
import server from "./mcp";


const app = express();

app.use(express.json());
app.use(cors());

app.get("/positions", async (req, res) => {
    try {
        
        const positions = await getPositions();
        res.json({ positions, status: true });

    } catch (error) {
        res.json({ error, status: false });
    }
})


const transports = {
  streamable: {} as Record<string, StreamableHTTPServerTransport>,
  sse: {} as Record<string, SSEServerTransport>
};


app.get('/sse', async (req, res) => {
  // Create SSE transport for legacy clients
  const transport = new SSEServerTransport('/messages', res);
  transports.sse[transport.sessionId] = transport;
  
  res.on("close", () => {
    delete transports.sse[transport.sessionId];
  });
  
  await server.connect(transport);
});

app.post('/messages', async (req, res) => {
  const sessionId = req.query.sessionId as string;
  const transport = transports.sse[sessionId];
  if (transport) {
    await transport.handlePostMessage(req, res, req.body);
  } else {
    res.status(400).send('No transport found for sessionId');
  }
});


app.listen(3000, () => {
    console.log("Server Started")
})