import { Request, Response } from "express";
import httpstatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { PropertyServices } from "./property.service";

const getAllProperties = catchAsync(async (req: Request, res: Response) => {
	const properties = await PropertyServices.getAllProperties();

	sendResponse(res, {
		statusCode: httpstatus.OK,
		success: true,
		message: "Profile Picture Uploaded Successfully.",
		data: properties,
	});
});

export const PropertyController = {
	getAllProperties,
};
