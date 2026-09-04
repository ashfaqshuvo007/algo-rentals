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
		message: "Properties Retrieved Successfully.",
		data: properties,
	});
});

const getSingleProperty = catchAsync(async (req: Request, res: Response) => {
	const propertyId = req.params.propertyId as string;
	const property = await PropertyServices.getSingleProperty(propertyId);

	sendResponse(res, {
		statusCode: httpstatus.OK,
		success: true,
		message: "Property Retrieved Successfully.",
		data: property,
	});
});

const getMyProperties = catchAsync(async (req: Request, res: Response) => {
	const userId = req.user?.userId as string;
	console.log(req.user);
	const properties = await PropertyServices.getOwnerProperties(userId);

	sendResponse(res, {
		statusCode: httpstatus.OK,
		success: true,
		message: "Properties Retrieved Successfully.",
		data: properties,
	});
});

const assignPropertyToOwner = catchAsync(
	async (req: Request, res: Response) => {
		const payload = req.body;
		const udpatedProperty =
			await PropertyServices.assignPropertyToOwner(payload);

		sendResponse(res, {
			statusCode: httpstatus.OK,
			success: true,
			message: "Assigned Owner To Property Successfully.",
			data: udpatedProperty,
		});
	},
);

const createProperty = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;
	const ownerId = req.user?.userId;

	const createdProperty = await PropertyServices.createProperty(
		payload,
		ownerId as string,
	);

	sendResponse(res, {
		statusCode: httpstatus.OK,
		success: true,
		message: "Property Created Successfully.",
		data: createdProperty,
	});
});

export const PropertyController = {
	getAllProperties,
	assignPropertyToOwner,
	createProperty,
	getSingleProperty,
	getMyProperties,
};
