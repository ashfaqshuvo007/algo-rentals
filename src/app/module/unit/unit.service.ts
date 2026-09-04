import { prisma } from "../../lib/prisma";

const getAllUnits = async () => {
	return prisma.unit.findMany();
};

const getSingleUnit = async (unitId: string) => {
	return prisma.unit.findUnique({
		where: {
			id: unitId,
		},
		include: {
			tenants: true,
		},
	});
};

const getUnitTenants = async (unitId: string) => {
	return prisma.unit.findUnique({
		where: {
			id: unitId,
		},
		include: {
			tenants: true,
		},
	});
};

const updateUnit = async (unitId: string, payload: any) => {
	// const {} = payload;
	return prisma.unit.update({
		where: {
			id: unitId,
		},
		data: {},
	});
};

const createUnit = async (payload: any) => {
	// const {} = payload;
	// return prisma.unit.create({
	// 	data: {},
	// });
};

export const UnitServices = {
	getAllUnits,
	getSingleUnit,
	getUnitTenants,
	createUnit,
	updateUnit,
};
