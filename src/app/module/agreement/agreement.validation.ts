import { z } from "zod";

const initiateAgreementSchema = z.object({
	unitId: z.string("Unit ID is required."),
	startDate: z.coerce.date("Start Date is required."),
	tenantId: z.string().optional(),
});

const confirmPaymentSchema = z.object({
	paymentID: z.string("Payment ID is required."),
});

const finalizeAgreementSchema = z.object({
	startDate: z.coerce.date().optional(),
});

const terminationSchema = z.object({
	reason: z.string().optional(),
});

export const AgreementValidation = {
	initiateAgreementSchema,
	confirmPaymentSchema,
	finalizeAgreementSchema,
	terminationSchema,
};
