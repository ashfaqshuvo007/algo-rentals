import cookieParser from "cookie-parser";
import cors from "cors";
import express, {
	type Application,
	NextFunction,
	type Request,
	type Response,
} from "express";
import httpStatus from "http-status";
import config from "./app/config";
import { BkashConfig } from "./app/lib/bkash";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import { notFound } from "./app/middleware/notFound";
import { AgreementRoutes } from "./app/module/agreement/agreement.route";
import { AuthRoutes } from "./app/module/auth/auth.route";
import { PropertyRoutes } from "./app/module/property/property.route";
import { TenantRoutes } from "./app/module/tenant/tenant.route";
import { UnitRoutes } from "./app/module/unit/unit.route";

const app: Application = express();

app.use(
	cors({
		origin: config.frontend_url,
		credentials: true,
	}),
);

// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cookieParser());

app.use("/api/v1/auth", AuthRoutes);
app.use("/api/v1/tenant", TenantRoutes);
app.use("/api/v1/property", PropertyRoutes);
app.use("/api/v1/unit", UnitRoutes);
app.use("/api/v1/agreement", AgreementRoutes);

// Basic route
app.get("/", async (req: Request, res: Response) => {
	res.status(httpStatus.OK).json({
		success: true,
		message: "Welcome to Algodevs Rental Management System Backend",
	});
});

// Testing Redis
app.get("/test", async (req: Request, res: Response, next: NextFunction) => {
	try {
		const grantIdTokenResult = await BkashConfig.getBkashIdToken();
		res.status(httpStatus.OK).json({
			success: true,
			message: "Welcome to Algodevs Rental Management System Backend",
			data: null,
		});
	} catch (error) {
		next(error);
	}
});

app.use(globalErrorHandler);
app.use(notFound);

export default app;
