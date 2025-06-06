import {
    DhanEnv,
    DhanHqClient
} from "dhanhq";
import dotenv from "dotenv"

dotenv.config();

const ACCESS_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJpc3MiOiJkaGFuIiwicGFydG5lcklkIjoiIiwiZXhwIjoxNzUxNzcwMzkyLCJ0b2tlbkNvbnN1bWVyVHlwZSI6IlNFTEYiLCJ3ZWJob29rVXJsIjoiIiwiZGhhbkNsaWVudElkIjoiMTEwMzE3NjM3NSJ9.7LZqaPdZdytpK8QV9ae5cgURRr0_wjqpEHhH-6UjsUYuILEA73Sm8-htOR-ewmwbVAjkAoHs022BgUG2JiXCig";
const DHAN_CLIENT_ID = process.env.DHAN_CLIENT_ID;

if (!ACCESS_TOKEN) {
    throw new Error("Missing required environment variables: ACCESS_TOKEN or DHAN_CLIENT_ID");
}

const client: DhanHqClient = new DhanHqClient({
    accessToken: ACCESS_TOKEN,
    env: DhanEnv.PROD
});

export async function getPositions(): Promise<any> {
    try {
        const positions = await client.getPositions();
        return positions;
    } catch (error) {
        console.error("Error fetching positions:", error);
        throw error instanceof Error ? error : new Error("Failed to fetch positions");
    }
}
