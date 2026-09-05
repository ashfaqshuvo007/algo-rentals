import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import zodValidation from "../../middleware/zodValidation";
import { AgreementController } from "./agreement.controller";
import { AgreementValidation } from "./agreement.validation";

const router = Router();

router.post(
	"/initiate",
	auth(Role.TENANT, Role.ADMIN, Role.SUPER_ADMIN),
	zodValidation(AgreementValidation.initiateAgreementSchema),
	AgreementController.initiateAgreement,
);

router.get(
	"/create-agreement/payment/callback",
	AgreementController.agreementPaymentCallback,
);

router.patch(
	"/:agreementId/finalize",
	auth(Role.OWNER),
	zodValidation(AgreementValidation.finalizeAgreementSchema),
	AgreementController.finalizeAgreement,
);

router.post(
	"/:agreementId/retry-payment",
	auth(Role.TENANT, Role.ADMIN, Role.SUPER_ADMIN),
	AgreementController.retryAgreementPayment,
);

router.post(
	"/:agreementId/terminate/request",
	auth(Role.TENANT),
	zodValidation(AgreementValidation.terminationSchema),
	AgreementController.requestAgreementTermination,
);

router.patch(
	"/:agreementId/terminate",
	auth(Role.OWNER),
	zodValidation(AgreementValidation.terminationSchema),
	AgreementController.terminateAgreement,
);

router.patch(
	"/:agreementId/terminate/reject",
	auth(Role.OWNER),
	AgreementController.rejectAgreementTermination,
);

export const AgreementRoutes = router;
