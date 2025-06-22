import {
	DhanEnv,
	DhanHqClient,
	ExchangeSegment,
	OrderDetail,
	OrderType,
	PositionDetail,
	ProductType,
	TransactionType,
	Validity
} from "dhanhq";
import dotenv from "dotenv"

dotenv.config();

const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const DHAN_CLIENT_ID = process.env.DHAN_CLIENT_ID;

let activeCE: number = 0;
let activePE: number = Infinity;
let activePositions: PositionDetail[]

if (!ACCESS_TOKEN) {
	throw new Error("Missing required environment variables: ACCESS_TOKEN or DHAN_CLIENT_ID");
}

const client: DhanHqClient = new DhanHqClient({
	accessToken: ACCESS_TOKEN,
	env: DhanEnv.PROD
});

export const getNiftyPrice = () => {
	//TODO
	return 25000;
}

export async function getPositions(): Promise<any> {
	try {
		const positions = await client.getPositions();
		return positions;
	} catch (error) {
		console.error("Error fetching positions:", error);
		throw error instanceof Error ? error : new Error("Failed to fetch positions");
	}
}

export const extractActiveStrikes = () => {

	activePositions.forEach(p => {
		if (p.netQty === 0) return;
		if (p.drvOptionType === "CALL" && p.netQty !== 0) activeCE = p.drvStrikePrice;
		if (p.drvOptionType === "PUT" && p.netQty !== 0) activePE = p.drvStrikePrice;
	});

}

export const rollCE = async (oldStrike: number, newStrike: number) => {

	console.log(`Rolling CE from ${oldStrike} to ${newStrike}`);
	const positions = activePositions;

	const shortLeg = activePositions.find(p =>
		p.drvOptionType === "CALL" &&
		p.drvStrikePrice === oldStrike &&
		p.netQty < 0
	);
	const longLeg = activePositions.find(p =>
		p.drvOptionType === "CALL" &&
		p.drvStrikePrice === oldStrike &&
		p.netQty > 0
	);

	if (!shortLeg) {
		return console.warn(`No proper calendar structure at CE ${oldStrike}`);
	}


	try {
		type PlaceOrderInput = {
			dhanClientId: string;
			transactionType: TransactionType;
			exchangeSegment: ExchangeSegment;
			productType: ProductType;
			validity: Validity;
			securityId: string;
			quantity: number;
			price: number;
			triggerPrice: number;
			orderType: OrderType;
			disclosedQuantity: number;
			afterMarketOrder: boolean;
			correlationId: string;
		};

		const order = {
			dhanClientId: shortLeg.dhanClientId,
			transactionType: TransactionType.BUY,
			exchangeSegment: ExchangeSegment.NSE_FNO,
			productType: ProductType.MARGIN,
			validity: Validity.DAY,
			securityId: shortLeg.securityId,
			quantity: Math.abs(shortLeg.netQty),
			price: 0,
			triggerPrice: 0,
			orderType: OrderType.MARKET,
			disclosedQuantity: 0,
			afterMarketOrder: false,
			correlationId: `roll-short-${Date.now()}`
		};

		console.log(order)


		const response = await client.placeOrder(order as any)
		console.log(response);

	} catch (error) {

	}

}

export const rollPE = async (oldStrike: number, newStrike: number) => {

	console.log(`Rolling PE from ${oldStrike} to ${newStrike}`);
	const positions = activePositions;
	const open = positions.filter(p => p.drvStrikePrice === oldStrike && p.drvOptionType === "PUT");
	console.log(open);

}

// setInterval(() => {

// }, 10000)

const niftyLTP = getNiftyPrice();
getPositions()
	.then(async (positions) => {
		activePositions = positions
		extractActiveStrikes();

		if (niftyLTP > activeCE) {
			await rollCE(activeCE, activeCE + 100);
		}
		else if (niftyLTP < activePE) {
			await rollPE(activePE, activePE - 100);
		}
		else {
			console.log("Currently in range")
		}
	})
