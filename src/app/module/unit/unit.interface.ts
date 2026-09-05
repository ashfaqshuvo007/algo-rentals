import z from "zod";
import { Agreement, Property, Tenant } from "../../../generated/prisma/client";
import { UnitStatus, UnitType } from "../../../generated/prisma/enums";
import { UnitValidation } from "./unit.validation";
export interface IUnitCreatePayload {
	unitNo: string;
	type: string;
	floor?: number;
	lengthFt?: number;
	widthFt?: number;
	occupancyLimit?: number;
	monthlyRent: number;
	status?: UnitStatus;
	propertyId: string;
	securityDepositAmount: number;

	property?: Property;
	agreements?: Agreement;
	tenants?: Tenant;
}

export interface IGetAllUnitsQuery {
	page: number;
	limit: number;
	status?: UnitStatus;
	occupancyLimit?: number;
	type?: UnitType;
	floor?: number;
	propertyId?: string;
	minRent?: number;
	maxRent?: number;
}

export type IUpdateUnitPayload = z.infer<
	typeof UnitValidation.updateUnitSchema
>;
