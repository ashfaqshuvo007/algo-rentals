import { z } from "zod";
import { UnitStatus } from "../../../generated/prisma/enums";

const createUnitSchema = z.object({
	unitNo: z.string("Unit No is required."),
	type: z.string("Type is required."),
	floor: z.number("Floor is required.").int("Floor must be an integer."),
	lengthFt: z
		.number("Length (ft) is required.")
		.int("Length must be an integer."),
	widthFt: z.number("Width (ft) is required.").int("Width must be an integer."),
	occupancyLimit: z
		.number("Occupancy Limit is required.")
		.int("Occupancy Limit must be an integer."),
	propertyId: z.string("Property ID is required."),
	monthlyRent: z
		.number("Monthly Rent is required.")
		.int("Monthly Rent must be an integer."),
	securityDepositAmount: z
		.number("Security Deposit Amount is required.")
		.int("Security Deposit Amount must be an integer."),
});

const getAllUnitsSchema = z.object({
	page: z
		.string()
		.optional()
		.transform((val) => (val ? Number.parseInt(val, 10) : 1)),
	limit: z
		.string()
		.optional()
		.transform((val) => (val ? Number.parseInt(val, 10) : 10)),
	status: z.enum(["VACANT", "OCCUPIED", "RESERVED", "MAINTENANCE"]).optional(),
	occupancyLimit: z
		.string()
		.optional()
		.transform((val) => (val ? Number.parseInt(val, 10) : undefined)),
	type: z.enum(["ROOM", "SHOP"]).optional(),
	floor: z
		.string()
		.optional()
		.transform((val) => (val ? Number.parseInt(val, 10) : undefined)),
	propertyId: z.string().optional(),
	minRent: z
		.string()
		.optional()
		.transform((val) => (val ? Number.parseInt(val, 10) : undefined)),
	maxRent: z
		.string()
		.optional()
		.transform((val) => (val ? Number.parseInt(val, 10) : undefined)),
});

const updateUnitSchema = createUnitSchema
	.extend({
		status: z.enum(UnitStatus).optional(),
	})
	.partial()
	.refine((data) => Object.keys(data).length > 0, {
		message: "At least one field must be provided to update.",
	});

export const UnitValidation = {
	createUnitSchema,
	updateUnitSchema,
	getAllUnitsSchema,
};
