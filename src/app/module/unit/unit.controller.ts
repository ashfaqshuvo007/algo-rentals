import { Request, Response } from "express";
import httpstatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { IGetAllUnitsQuery, IUpdateUnitPayload } from "./unit.interface";
import { UnitServices } from "./unit.service";

const getAllUnits = catchAsync(async (req: Request, res: Response) => {
	const result = await UnitServices.getAllUnits(
		req.validatedQuery as unknown as IGetAllUnitsQuery,
	);
	sendResponse(res, {
		statusCode: httpstatus.OK,
		success: true,
		message: "Units Retrieved Successfully.",
		data: result.data,
		meta: result.meta,
	});
});

const getSingleUnit = catchAsync(async (req: Request, res: Response) => {
	const unit = await UnitServices.getSingleUnit(req.params.unitId as string);
	sendResponse(res, {
		statusCode: httpstatus.OK,
		success: true,
		message: "Unit Retrieved Successfully.",
		data: unit,
	});
});

const getUnitTenants = catchAsync(async (req: Request, res: Response) => {
	const tenants = {};
	sendResponse(res, {
		statusCode: httpstatus.OK,
		success: true,
		message: "Unit Tenants Retrieved Successfully.",
		data: tenants,
	});
});

const createUnit = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;
	const unit = await UnitServices.createUnit(payload);
	sendResponse(res, {
		statusCode: httpstatus.OK,
		success: true,
		message: "Unit Created Successfully.",
		data: unit,
	});
});

const updateUnit = catchAsync(async (req: Request, res: Response) => {
	const unitId = req.params.unitId as string;
	const unit = await UnitServices.updateUnit(
		unitId,
		req.body as IUpdateUnitPayload,
	);
	sendResponse(res, {
		statusCode: httpstatus.OK,
		success: true,
		message: "Unit Updated Successfully.",
		data: unit,
	});
});

export const UnitController = {
	getAllUnits,
	getSingleUnit,
	getUnitTenants,
	createUnit,
	updateUnit,
};
