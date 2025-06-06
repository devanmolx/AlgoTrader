import express from "express"
import cors from "cors"
import { getPositions } from "./utils/dhan";

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

app.listen(4000, () => {
    console.log("Server Started")
})