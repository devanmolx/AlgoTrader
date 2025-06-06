import {
    DhanEnv,
    DhanHqClient
} from "dhanhq";
import dotenv from "dotenv"

dotenv.config();

const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const DHAN_CLIENT_ID = process.env.DHAN_CLIENT_ID;

const client: DhanHqClient = new DhanHqClient({
    accessToken: ACCESS_TOKEN || "",
    env: DhanEnv.PROD
});

export async function getPositions() {
    try {
        const positions = await client.getPositions();
        return positions;
    } catch (exception) {
        return exception;
    }
}

getPositions();
