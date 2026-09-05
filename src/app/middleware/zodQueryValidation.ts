import type { NextFunction, Request, Response } from "express";
import type { z } from "zod";
import { catchAsync } from "../utils/catchAsync";

const zodQueryValidation = <T extends z.ZodType>(zodSchema: T) => {
	return catchAsync((req: Request, res: Response, next: NextFunction) => {
		const payload = req.query ?? {};
		const result = zodSchema.safeParse(payload);
		if (!result.success) {
			console.log(result.error);
			console.log(result.error.issues);
			throw new Error(result.error.issues[0].message);
		}
		req.validatedQuery = result.data as Record<string, unknown>;
		next();
	});
};

export default zodQueryValidation;
