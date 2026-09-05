import type { Request, Response } from "express";
import httpstatus from "http-status";
import { Role } from "../../../generated/prisma/enums";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import type {
	IFinalizeAgreementPayload,
	IInitiateAgreementPayload,
	ITerminationPayload,
} from "./agreement.interface";
import { AgreementServices } from "./agreement.service";

const initiateAgreement = catchAsync(async (req: Request, res: Response) => {
	const { unitId, startDate, tenantId } = req.body as IInitiateAgreementPayload;
	const result = await AgreementServices.initiateAgreement({
		requesterUserId: req.user?.userId as string,
		requesterRole: req.user?.role as Role,
		unitId,
		startDate,
		tenantId,
	});
	sendResponse(res, {
		statusCode: httpstatus.OK,
		success: true,
		message: "Agreement Initiated. Complete payment to proceed.",
		data: result,
	});
});

const agreementPaymentCallback = catchAsync(
	async (req: Request, res: Response) => {
		const { redirectUrl } = await AgreementServices.agreementPaymentCallback(
			req.query,
		);
		res.redirect(redirectUrl);
	},
);

const finalizeAgreement = catchAsync(async (req: Request, res: Response) => {
	const { startDate } = req.body as IFinalizeAgreementPayload;
	const result = await AgreementServices.finalizeAgreement(
		req.params.agreementId as string,
		req.user?.userId as string,
		startDate,
	);
	sendResponse(res, {
		statusCode: httpstatus.OK,
		success: true,
		message: "Agreement Finalized and Activated.",
		data: result,
	});
});

const retryAgreementPayment = catchAsync(
	async (req: Request, res: Response) => {
		const result = await AgreementServices.retryAgreementPayment(
			req.params.agreementId as string,
			req.user?.userId as string,
			req.user?.role as Role,
		);
		sendResponse(res, {
			statusCode: httpstatus.OK,
			success: true,
			message: "Payment Retry Initiated.",
			data: result,
		});
	},
);

const requestAgreementTermination = catchAsync(
	async (req: Request, res: Response) => {
		const { reason } = req.body as ITerminationPayload;
		const result = await AgreementServices.requestAgreementTermination(
			req.params.agreementId as string,
			req.user?.userId as string,
			reason,
		);
		sendResponse(res, {
			statusCode: httpstatus.OK,
			success: true,
			message: "Termination Requested. Awaiting owner approval.",
			data: result,
		});
	},
);

const terminateAgreement = catchAsync(async (req: Request, res: Response) => {
	const { reason } = req.body as ITerminationPayload;
	const result = await AgreementServices.terminateAgreement(
		req.params.agreementId as string,
		req.user?.userId as string,
		reason,
	);
	sendResponse(res, {
		statusCode: httpstatus.OK,
		success: true,
		message: "Agreement Terminated.",
		data: result,
	});
});

const rejectAgreementTermination = catchAsync(
	async (req: Request, res: Response) => {
		const result = await AgreementServices.rejectAgreementTermination(
			req.params.agreementId as string,
			req.user?.userId as string,
		);
		sendResponse(res, {
			statusCode: httpstatus.OK,
			success: true,
			message: "Termination Request Rejected. Agreement remains active.",
			data: result,
		});
	},
);

export const AgreementController = {
	initiateAgreement,
	agreementPaymentCallback,
	finalizeAgreement,
	retryAgreementPayment,
	requestAgreementTermination,
	terminateAgreement,
	rejectAgreementTermination,
};
