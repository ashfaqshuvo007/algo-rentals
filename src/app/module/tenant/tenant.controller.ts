import { Request, Response } from "express";
import httpstatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { TenantService } from "./tenant.service";

const uploadProfileImage = catchAsync(async (req: Request, res: Response) => {
	if (!req.file) {
		throw new Error("No File Uploaded.");
	}
	const userId = req.user?.userId;
	const updatedUser = await TenantService.uploadProfileImage(
		req.file?.buffer,
		userId as string,
	);
	sendResponse(res, {
		statusCode: httpstatus.OK,
		success: true,
		message: "Profile Picture Uploaded Successfully.",
		data: updatedUser,
	});
});

const uploadNid = catchAsync(async (req: Request, res: Response) => {
	if (!req.file) {
		throw new Error("No File Uploaded.");
	}

	const { nidNumber } = req.body;

	if (!nidNumber) {
		throw new Error("NID Number is required.");
	}

	const userId = req.user?.userId;
	const updatedTenant = await TenantService.uploadNid(
		req.file?.buffer,
		userId as string,
		nidNumber as string,
	);

	sendResponse(res, {
		statusCode: httpstatus.OK,
		success: true,
		message: "NID Verification Updated Successfully.",
		data: updatedTenant,
	});
});
export const UserController = {
	uploadProfileImage,
	uploadNid,
};
