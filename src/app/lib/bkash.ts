import config from "../config";
import { redisClient } from "./redis";

const getBkashIdToken = async () => {
	try {
		const IdTokenKey = "bkash:idToken";
		const RefreshTokenKey = "bkash:refreshToken";

		//Checking for token exists
		let bkashIdToken = await redisClient.get(IdTokenKey);
		const bkashIdTokenTTL = await redisClient.ttl(IdTokenKey);

		let bkashRefreshToken = await redisClient.get(IdTokenKey);
		const bkashRefreshTokenTTL = await redisClient.ttl(RefreshTokenKey);

		// Bkash ID_TOKEN expired OR ttl <= 10 mins
		// Bkash refresh_token exists && refresh_token TTL > 10 mins
		if (
			(!bkashIdToken || bkashIdTokenTTL <= 600) &&
			bkashRefreshToken &&
			bkashRefreshTokenTTL > 600
		) {
			const refreshTokenResponse = await fetch(
				`${config.bkash_base_url}/tokenized/checkout/token/refresh`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Accept: "application/json",
						username: config.bkash_username,
						password: config.bkash_password,
					},
					body: JSON.stringify({
						app_key: config.bkash_app_key,
						app_secret: config.bkash_app_secret,
						refresh_token: bkashRefreshToken,
					}),
				},
			);

			if (!refreshTokenResponse.ok) {
				throw new Error("Bkash Access Token Grant Failed.");
			}

			const bkashRefreshTokenResult = await refreshTokenResponse.json();
			bkashIdToken = bkashRefreshTokenResult.id_token as string;

			await redisClient.set(IdTokenKey, bkashIdToken, {
				expiration: {
					type: "EX",
					value: 60 * 60,
				},
			});
			return bkashIdToken;
		}

		if (bkashIdTokenTTL > 600) {
			return bkashIdToken;
		}

		// Not token exists
		const response = await fetch(
			`${config.bkash_base_url}/tokenized/checkout/token/grant`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
					username: config.bkash_username,
					password: config.bkash_password,
				},
				body: JSON.stringify({
					app_key: config.bkash_app_key,
					app_secret: config.bkash_app_secret,
				}),
			},
		);
		if (!response.ok) {
			throw new Error("Bkash Access Token Grant Failed.");
		}

		const result = await response.json();

		await redisClient.set(IdTokenKey, result.id_token, {
			expiration: {
				type: "EX",
				value: 60 * 60, // 1hr
			},
		});

		await redisClient.set(RefreshTokenKey, result.refresh_token, {
			expiration: {
				type: "EX",
				value: 28 * 24 * 60 * 60, //28 days
			},
		});
		bkashIdToken = result.id_token;
		bkashRefreshToken = result.refresh_token;
		return bkashIdToken;
	} catch (error: any) {
		throw new Error("Bkash keys generation failed : ", error);
	}
};

const createBkashPayment = async (payload: {
	amount: number;
	payerReference: string;
	callbackURL: string;
	merchantInvoiceNumber: string;
}) => {
	const idToken = await getBkashIdToken();

	const response = await fetch(
		`${config.bkash_base_url}/tokenized/checkout/create`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
				Authorization: idToken as string,
				"X-App-Key": config.bkash_app_key,
			},
			body: JSON.stringify({
				mode: "0011",
				payerReference: payload.payerReference,
				callbackURL: payload.callbackURL,
				amount: payload.amount.toString(),
				currency: "BDT",
				intent: "sale",
				merchantInvoiceNumber: payload.merchantInvoiceNumber,
			}),
		},
	);

	if (!response.ok) {
		throw new Error("Bkash Create Payment Failed.");
	}

	const result = await response.json();

	if (result.statusCode && result.statusCode !== "0000") {
		throw new Error(result.statusMessage || "Bkash Create Payment Failed.");
	}

	return result as { paymentID: string; bkashURL: string };
};

const executeBkashPayment = async (paymentID: string) => {
	const idToken = await getBkashIdToken();

	const response = await fetch(
		`${config.bkash_base_url}/tokenized/checkout/execute`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
				Authorization: idToken as string,
				"X-App-Key": config.bkash_app_key,
			},
			body: JSON.stringify({ paymentID }),
		},
	);

	if (!response.ok) {
		throw new Error("Bkash Execute Payment Failed.");
	}

	return (await response.json()) as {
		paymentID: string;
		trxID?: string;
		transactionStatus: string;
		amount: string;
	};
};

export const BkashConfig = {
	getBkashIdToken,
	createBkashPayment,
	executeBkashPayment,
};
