import { Prisma } from "../../../generated/prisma/client";
import { UnitType } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import {
	IGetAllUnitsQuery,
	IUnitCreatePayload,
	IUpdateUnitPayload,
} from "./unit.interface";

const getAllUnits = async (filters: IGetAllUnitsQuery) => {
	const {
		page,
		limit,
		status,
		occupancyLimit,
		type,
		floor,
		propertyId,
		minRent,
		maxRent,
	} = filters;

	const where: Prisma.UnitWhereInput = {
		...(status && { status }),
		...(occupancyLimit !== undefined && { occupancyLimit }),
		...(type && { type }),
		...(floor !== undefined && { floor }),
		...(propertyId && { propertyId }),
		...((minRent !== undefined || maxRent !== undefined) && {
			monthlyRent: {
				...(minRent !== undefined && { gte: minRent }),
				...(maxRent !== undefined && { lte: maxRent }),
			},
		}),
	};

	const skip = (page - 1) * limit;

	const [units, total] = await Promise.all([
		prisma.unit.findMany({ where, skip, take: limit }),
		prisma.unit.count({ where }),
	]);

	return {
		data: units,
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
};

const getSingleUnit = async (unitId: string) => {
	const unit = await prisma.unit.findUnique({
		where: {
			id: unitId,
		},
		include: {
			tenants: true,
		},
	});
	return unit;
};

const getUnitTenants = async (unitId: string) => {
	const unitTenants = await prisma.unit.findUnique({
		where: {
			id: unitId,
		},
		include: {
			tenants: true,
		},
	});
	return unitTenants;
};

const updateUnit = async (unitId: string, payload: IUpdateUnitPayload) => {
	const { propertyId, type, ...rest } = payload;

	const unit = await prisma.unit.update({
		where: {
			id: unitId,
		},
		data: {
			...rest,
			...(type && { type: type as UnitType }),
			...(propertyId && { property: { connect: { id: propertyId } } }),
		},
	});

	return unit;
};

const createUnit = async (payload: IUnitCreatePayload) => {
	const {
		unitNo,
		type,
		floor,
		lengthFt,
		widthFt,
		occupancyLimit,
		propertyId,
		monthlyRent,
		securityDepositAmount,
	} = payload;

	const property = await prisma.property.findUnique({
		where: {
			id: propertyId,
		},
	});

	if (!property) {
		throw new Error("Property Does not Exist.");
	}
	const createUnitData = {
		unitNo: unitNo,
		type: type as UnitType,
		floor: floor,
		lengthFt: lengthFt as number,
		widthFt: widthFt as number,
		occupancyLimit: occupancyLimit as number,
		propertyId: property.id,
		monthlyRent: monthlyRent as number,
		securityDepositAmount: securityDepositAmount,
	};

	const createdUnit = await prisma.unit.create({
		data: createUnitData,
	});

	return createdUnit;
};

export const UnitServices = {
	getAllUnits,
	getSingleUnit,
	getUnitTenants,
	createUnit,
	updateUnit,
};
