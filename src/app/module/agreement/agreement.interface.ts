import type { z } from "zod";
import { Role } from "../../../generated/prisma/enums";
import type { AgreementValidation } from "./agreement.validation";

export type IInitiateAgreementPayload = z.infer<
	typeof AgreementValidation.initiateAgreementSchema
>;
export type IConfirmPaymentPayload = z.infer<
	typeof AgreementValidation.confirmPaymentSchema
>;
export type IFinalizeAgreementPayload = z.infer<
	typeof AgreementValidation.finalizeAgreementSchema
>;
export type ITerminationPayload = z.infer<
	typeof AgreementValidation.terminationSchema
>;

export interface IInitiateAgreementParams extends IInitiateAgreementPayload {
	requesterUserId: string;
	requesterRole: Role;
}
