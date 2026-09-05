import {
	AgreementStatus,
	PaymentMethod,
	PaymentStatus,
	PaymentType,
	Role,
	UnitStatus,
} from "../../../generated/prisma/enums";
import config from "../../config";
import { BkashConfig } from "../../lib/bkash";
import { prisma } from "../../lib/prisma";
import type { IInitiateAgreementParams } from "./agreement.interface";

const BKASH_PAYMENT_CALLBACK_URL = `${config.bkash_callback_url}/agreement/create-agreement/payment/callback`;

const initiateAgreement = async (params: IInitiateAgreementParams) => {
	const { requesterUserId, requesterRole, unitId, startDate, tenantId } =
		params;

	// 1. Resolve the tenant profile
	let tenant: any;
	if (requesterRole === Role.TENANT) {
		tenant = await prisma.tenant.findUnique({
			where: { userId: requesterUserId },
			include: { agreement: true },
		});
		if (!tenant) throw new Error("Tenant profile not found.");
	} else {
		if (!tenantId)
			throw new Error(
				"Tenant ID is required when initiating on behalf of a tenant.",
			);
		tenant = await prisma.tenant.findUnique({
			where: { id: tenantId },
			include: { agreement: true },
		});
		if (!tenant) throw new Error("Tenant not found.");
	}

	// 2. NID check
	if (!tenant.nidNumber || !tenant.nidUrl) {
		throw new Error(
			"Tenant must upload NID and provide NID number before initiating an agreement.",
		);
	}

	// 3. Block concurrent agreements
	if (tenant.agreement || tenant.unitId) {
		throw new Error("Tenant already has an existing or in-progress agreement.");
	}

	// 4. Unit availability check
	const unit = await prisma.unit.findUnique({ where: { id: unitId } });
	if (!unit) throw new Error("Unit not found.");
	if (unit.status !== UnitStatus.VACANT)
		throw new Error("Unit is not available for rent.");

	// 5. Create Agreement + Payment + reserve Unit + assign Tenant, all-or-nothing
	const { agreement, payment } = await prisma.$transaction(async (tx) => {
		const agreement = await tx.agreement.create({
			data: {
				tenantProfileId: tenant.id,
				unitId: unit.id,
				status: AgreementStatus.PENDING_PAYMENT,
				startDate,
				monthlyRent: unit.monthlyRent,
				securityDepositAmount: unit.securityDepositAmount,
			},
		});

		const payment = await tx.payment.create({
			data: {
				tenantProfileId: tenant.id,
				agreementId: agreement.id,
				type: PaymentType.SECURITY_DEPOSIT,
				method: PaymentMethod.BKASH,
				amount: unit.securityDepositAmount,
				status: PaymentStatus.INITIATED,
			},
		});

		await tx.unit.update({
			where: { id: unit.id },
			data: { status: UnitStatus.RESERVED },
		});
		await tx.tenant.update({
			where: { id: tenant.id },
			data: { unitId: unit.id },
		});

		return { agreement, payment };
	});

	// 6. Call bKash (outside the DB transaction — it's a network call)
	let bkashPayment: { paymentID: string; bkashURL: string };
	try {
		bkashPayment = await BkashConfig.createBkashPayment({
			amount: payment.amount.toNumber(),
			payerReference: tenant.contactNumber ?? tenant.id,
			callbackURL: BKASH_PAYMENT_CALLBACK_URL,
			merchantInvoiceNumber: payment.id,
		});
	} catch (error) {
		// Roll back everything — the reservation never really happened
		await prisma.$transaction([
			prisma.payment.delete({ where: { id: payment.id } }),
			prisma.agreement.delete({ where: { id: agreement.id } }),
			prisma.unit.update({
				where: { id: unit.id },
				data: { status: UnitStatus.VACANT },
			}),
			prisma.tenant.update({
				where: { id: tenant.id },
				data: { unitId: null },
			}),
		]);
		throw new Error("Failed to initiate bKash payment. Please try again.");
	}

	// 7. Persist the bKash paymentID — the callback looks the Payment up by this field
	await prisma.payment.update({
		where: { id: payment.id },
		data: { bkashPaymentId: bkashPayment.paymentID },
	});

	return { agreement, bkashURL: bkashPayment.bkashURL };
};

const agreementPaymentCallback = async (query: Record<string, any>) => {
	const paymentID = query.paymentID as string | undefined;
	const status = query.status as string | undefined;

	if (!paymentID) throw new Error("Payment ID Missing.");
	if (!status) throw new Error("Payment Status Missing.");

	const payment = await prisma.payment.findUnique({
		where: { bkashPaymentId: paymentID },
	});

	if (!payment?.agreementId) {
		return {
			redirectUrl: `${config.frontend_url}/agreements/payment-result?status=invalid`,
		};
	}

	const bkashIdToken = await BkashConfig.getBkashIdToken();
	if (!bkashIdToken) throw new Error("Bkash Access Token Not Found.");

	// Call execute for every outcome — even on cancel/failure this captures
	// bKash's own server-side reason in gatewayResponse for the audit trail.
	const executePaymentResponse = await fetch(
		`${config.bkash_base_url}/tokenized/checkout/execute`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
				Authorization: bkashIdToken as string,
				"X-App-Key": config.bkash_app_key,
			},
			body: JSON.stringify({ paymentID }),
		},
	);
	const executedPaymentResult = await executePaymentResponse.json();

	// Network call is done — now do the atomic DB writes.
	const transactionResult = await prisma.$transaction(async (tx) => {
		if (
			status === "success" &&
			executedPaymentResult.transactionStatus === "Completed"
		) {
			await tx.payment.update({
				where: { id: payment.id },
				data: {
					status: PaymentStatus.PAID,
					bkashTransactionId: executedPaymentResult.trxID,
					paidAt: new Date(),
					gatewayResponse: executedPaymentResult,
				},
			});
			await tx.agreement.update({
				where: { id: payment.agreementId as string },
				data: { status: AgreementStatus.PENDING_APPROVAL },
			});
			return {
				executedPaymentResult,
				redirectUrl: `${config.frontend_url}/agreements/payment-result?status=success&agreementId=${payment.agreementId}`,
			};
		}

		if (status === "cancel") {
			await tx.payment.update({
				where: { id: payment.id },
				data: {
					status: PaymentStatus.CANCELLED,
					gatewayResponse: executedPaymentResult,
				},
			});
			return {
				executedPaymentResult,
				redirectUrl: `${config.frontend_url}/agreements/payment-result?status=cancel&agreementId=${payment.agreementId}`,
			};
		}

		// status === "failure", or a "success" redirect that execute didn't actually confirm
		await tx.payment.update({
			where: { id: payment.id },
			data: {
				status: PaymentStatus.FAILED,
				gatewayResponse: executedPaymentResult,
			},
		});
		return {
			executedPaymentResult,
			redirectUrl: `${config.frontend_url}/agreements/payment-result?status=failure&agreementId=${payment.agreementId}`,
		};
	});

	return transactionResult;
};

const finalizeAgreement = async (
	agreementId: string,
	requesterUserId: string,
	startDate?: Date,
) => {
	const owner = await prisma.owner.findUnique({
		where: { userId: requesterUserId },
	});

	if (!owner) {
		throw new Error("Owner profile not found.");
	}

	const agreement = await prisma.agreement.findUnique({
		where: { id: agreementId },
		include: { unit: true },
	});

	if (!agreement) {
		throw new Error("Agreement not found.");
	}

	if (agreement.status !== AgreementStatus.PENDING_APPROVAL) {
		throw new Error("Agreement is not awaiting approval.");
	}

	if (agreement.unit.propertyId !== owner.propertyId) {
		throw new Error("You are not authorized to finalize this agreement.");
	}

	const [updatedAgreement] = await prisma.$transaction([
		prisma.agreement.update({
			where: { id: agreementId },
			data: {
				status: AgreementStatus.ACTIVE,
				activatedAt: new Date(),
				startDate: startDate ?? agreement.startDate,
			},
		}),
		prisma.unit.update({
			where: { id: agreement.unitId },
			data: { status: UnitStatus.OCCUPIED },
		}),
	]);

	return updatedAgreement;
};

const retryAgreementPayment = async (
	agreementId: string,
	requesterUserId: string,
	requesterRole: Role,
) => {
	const agreement = await prisma.agreement.findUnique({
		where: { id: agreementId },
		include: { tenant: true },
	});
	if (!agreement) throw new Error("Agreement not found.");

	if (requesterRole === Role.TENANT) {
		const tenant = await prisma.tenant.findUnique({
			where: { userId: requesterUserId },
		});
		if (!tenant || tenant.id !== agreement.tenantProfileId) {
			throw new Error(
				"You are not authorized to retry payment for this agreement.",
			);
		}
	}

	if (agreement.status !== AgreementStatus.PENDING_PAYMENT) {
		throw new Error("This agreement is not awaiting payment.");
	}

	const payment = await prisma.payment.create({
		data: {
			tenantProfileId: agreement.tenantProfileId,
			agreementId: agreement.id,
			type: PaymentType.SECURITY_DEPOSIT,
			method: PaymentMethod.BKASH,
			amount: agreement.securityDepositAmount,
			status: PaymentStatus.INITIATED,
		},
	});

	let bkashPayment: { paymentID: string; bkashURL: string };
	try {
		bkashPayment = await BkashConfig.createBkashPayment({
			amount: payment.amount.toNumber(),
			payerReference:
				agreement.tenant.contactNumber ?? agreement.tenantProfileId,
			callbackURL: BKASH_PAYMENT_CALLBACK_URL,
			merchantInvoiceNumber: payment.id,
		});
	} catch (error) {
		await prisma.payment.update({
			where: { id: payment.id },
			data: { status: PaymentStatus.FAILED },
		});
		throw new Error("Failed to initiate bKash payment. Please try again.");
	}

	await prisma.payment.update({
		where: { id: payment.id },
		data: { bkashPaymentId: bkashPayment.paymentID },
	});

	return { agreement, bkashURL: bkashPayment.bkashURL };
};

const requestAgreementTermination = async (
	agreementId: string,
	requesterUserId: string,
	reason?: string,
) => {
	const tenant = await prisma.tenant.findUnique({
		where: { userId: requesterUserId },
	});
	if (!tenant) throw new Error("Tenant profile not found.");

	const agreement = await prisma.agreement.findUnique({
		where: { id: agreementId },
	});
	if (!agreement) throw new Error("Agreement not found.");

	if (agreement.tenantProfileId !== tenant.id) {
		throw new Error(
			"You are not authorized to request termination for this agreement.",
		);
	}
	if (agreement.status !== AgreementStatus.ACTIVE) {
		throw new Error("Only active agreements can have termination requested.");
	}

	const outstandingRentPayment = await prisma.payment.findFirst({
		where: {
			agreementId,
			type: PaymentType.RENT,
			status: { in: [PaymentStatus.INITIATED, PaymentStatus.FAILED] },
		},
	});
	if (outstandingRentPayment) {
		throw new Error(
			"Cannot request termination while a rent payment is outstanding. Please resolve it first.",
		);
	}

	const updated = await prisma.agreement.update({
		where: { id: agreementId },
		data: {
			status: AgreementStatus.PENDING_TERMINATION,
			terminationRequestedAt: new Date(),
			terminationReason: reason,
		},
	});

	return updated;
};

const terminateAgreement = async (
	agreementId: string,
	requesterUserId: string,
	reason?: string,
) => {
	const owner = await prisma.owner.findUnique({
		where: { userId: requesterUserId },
	});
	if (!owner) throw new Error("Owner profile not found.");

	const agreement = await prisma.agreement.findUnique({
		where: { id: agreementId },
		include: { unit: true },
	});
	if (!agreement) throw new Error("Agreement not found.");

	if (agreement.unit.propertyId !== owner.propertyId) {
		throw new Error("You are not authorized to terminate this agreement.");
	}
	if (
		agreement.status !== AgreementStatus.ACTIVE &&
		agreement.status !== AgreementStatus.PENDING_TERMINATION
	) {
		throw new Error("Agreement cannot be terminated in its current state.");
	}

	const outstandingRentPayment = await prisma.payment.findFirst({
		where: {
			agreementId,
			type: PaymentType.RENT,
			status: { in: [PaymentStatus.INITIATED, PaymentStatus.FAILED] },
		},
	});
	if (outstandingRentPayment) {
		throw new Error(
			"Cannot terminate agreement while a rent payment is outstanding. Please resolve it first.",
		);
	}

	const [updatedAgreement] = await prisma.$transaction([
		prisma.agreement.update({
			where: { id: agreementId },
			data: {
				status: AgreementStatus.TERMINATED,
				terminatedAt: new Date(),
				terminationReason: reason ?? agreement.terminationReason,
			},
		}),
		prisma.unit.update({
			where: { id: agreement.unitId },
			data: { status: UnitStatus.VACANT },
		}),
		prisma.tenant.update({
			where: { id: agreement.tenantProfileId },
			data: { unitId: null },
		}),
	]);

	return updatedAgreement;
};

const rejectAgreementTermination = async (
	agreementId: string,
	requesterUserId: string,
) => {
	const owner = await prisma.owner.findUnique({
		where: { userId: requesterUserId },
	});
	if (!owner) throw new Error("Owner profile not found.");

	const agreement = await prisma.agreement.findUnique({
		where: { id: agreementId },
		include: { unit: true },
	});
	if (!agreement) throw new Error("Agreement not found.");

	if (agreement.unit.propertyId !== owner.propertyId) {
		throw new Error("You are not authorized to act on this agreement.");
	}
	if (agreement.status !== AgreementStatus.PENDING_TERMINATION) {
		throw new Error(
			"There is no pending termination request to reject for this agreement.",
		);
	}

	const updated = await prisma.agreement.update({
		where: { id: agreementId },
		data: {
			status: AgreementStatus.ACTIVE,
			terminationRequestedAt: null,
			terminationReason: null,
		},
	});

	return updated;
};

export const AgreementServices = {
	initiateAgreement,
	agreementPaymentCallback,
	finalizeAgreement,
	retryAgreementPayment,
	requestAgreementTermination,
	terminateAgreement,
	rejectAgreementTermination,
};
