import { prisma } from "../../lib/prisma";
import {
	IAssignOwnerToPropertyPayload,
	ICreatePropertyPayload,
} from "./property.interface";

const getAllProperties = async () => {
	const properties = await prisma.property.findMany({
		include: {
			units: true,
			owner: true,
		},
	});

	return properties;
};

const getSingleProperty = async (propertyId: string) => {
	const properties = await prisma.property.findUnique({
		where: {
			id: propertyId,
		},
		include: {
			units: true,
			owner: true,
		},
	});

	return properties;
};

const getOwnerProperties = async (ownerId: string) => {
	const properties = await prisma.property.findMany({
		where: {
			ownerId: ownerId,
		},
		include: {
			units: true,
			owner: true,
		},
	});

	return properties;
};

const assignPropertyToOwner = async (
	payload: IAssignOwnerToPropertyPayload,
) => {
	const { ownerId, propertyId } = payload;

	const checkOwnerExists = await prisma.owner.findUnique({
		where: {
			id: ownerId,
		},
	});

	const checkPropertyExists = await prisma.property.findUnique({
		where: {
			id: propertyId,
		},
	});

	if (checkOwnerExists) {
		throw new Error("Owner Not Found");
	}

	if (!checkPropertyExists) {
		throw new Error("Property Not Found");
	}

	const udpatedProperty = await prisma.property.update({
		where: {
			id: propertyId,
		},
		data: {
			ownerId: ownerId,
		},
	});

	return udpatedProperty;
};

const createProperty = async (
	payload: ICreatePropertyPayload,
	ownerId: string,
) => {
	const { name, address } = payload;
	const isPropertyExists = await prisma.property.findUnique({
		where: {
			name: name,
			ownerId: ownerId,
		},
	});

	if (isPropertyExists) {
		throw new Error("Property Exists.");
	}

	const createdProperty = await prisma.property.create({
		data: {
			name: name,
			address: address,
		},
	});

	return createdProperty;
};

export const PropertyServices = {
	getAllProperties,
	assignPropertyToOwner,
	createProperty,
	getSingleProperty,
	getOwnerProperties,
};
