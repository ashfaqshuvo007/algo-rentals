import { prisma } from "../../lib/prisma";

const getAllProperties = async () => {
	const properties = await prisma.property.findMany({
		include: {
			units: true,
			owner: true,
		},
	});

	return properties;
};

export const PropertyServices = {
	getAllProperties,
};
