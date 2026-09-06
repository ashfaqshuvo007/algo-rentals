import bcrypt from "bcryptjs";
import { Role, UnitStatus, UnitType } from "../../generated/prisma/enums";
import config from "../config";
import { prisma } from "../lib/prisma";

export const seedAdmin = async () => {
	try {
		const isAdminExists = await prisma.user.findFirst({
			where: {
				role: Role.ADMIN,
			},
		});

		if (isAdminExists) {
			console.log("Admin Already Exists.");
			return;
		}
		const name = config.admin_name;
		const email = config.admin_email;
		const password = config.admin_password;

		if (!name || !email || !password) {
			throw new Error("Admin Details Missing in .env file.");
		}

		const hashedPassword = await bcrypt.hash(
			password,
			Number(config.bcrypt_salt_rounds),
		);

		const admin = await prisma.user.create({
			data: {
				name,
				email,
				password: hashedPassword,
				role: Role.ADMIN,
				needPasswordChange: false,
				emailVerified: true,
			},
		});

		console.log("Admin Created: ", admin);
	} catch (error) {
		console.log("Error seeding Admin : ", error);

		await prisma.user.delete({
			where: {
				email: config.admin_email,
			},
		});
	}
};

export const seedSuperAdmin = async () => {
	try {
		const isAdminExists = await prisma.user.findFirst({
			where: {
				role: Role.SUPER_ADMIN,
			},
		});

		if (isAdminExists) {
			console.log("Super Admin Already Exists.");
			return;
		}
		const name = config.super_admin_name;
		const email = config.super_admin_email;
		const password = config.super_admin_password;

		if (!name || !email || !password) {
			throw new Error("Super Admin Details Missing in .env file.");
		}

		const hashedPassword = await bcrypt.hash(
			password,
			Number(config.bcrypt_salt_rounds),
		);

		const superAdmin = await prisma.user.create({
			data: {
				name,
				email,
				password: hashedPassword,
				role: Role.SUPER_ADMIN,
				needPasswordChange: false,
				emailVerified: true,
			},
		});

		console.log("Super Admin Created: ", superAdmin);
	} catch (error) {
		console.log("Error seeding Super Admin : ", error);

		await prisma.user.delete({
			where: {
				email: config.super_admin_email,
			},
		});
	}
};

export const seedTestTenant = async () => {
	try {
		const isTestTenantExists = await prisma.user.findFirst({
			where: {
				role: Role.TENANT,
			},
		});

		if (isTestTenantExists) {
			console.log("Test Tenant Already Exists.");
			return;
		}
		const name = config.test_tenant_name;
		const email = config.test_tenant_email;
		const password = config.test_tenant_password;
		const presentAddress = config.test_tenant_address;
		const nidNumber = config.test_tenant_nid;

		if (!name || !email || !password) {
			throw new Error("Test Tenant Details Missing in .env file.");
		}

		const hashedPassword = await bcrypt.hash(
			password,
			Number(config.bcrypt_salt_rounds),
		);

		const testTenant = await prisma.user.create({
			data: {
				name,
				email,
				password: hashedPassword,
				role: Role.TENANT,
				needPasswordChange: false,
				emailVerified: true,
				tenant: {
					create: { name, email, nidNumber, presentAddress },
				},
			},
		});

		console.log("Test Tenant Created: ", testTenant);
	} catch (error) {
		console.log("Error Seeding Test Tenant : ", error);

		await prisma.user.delete({
			where: {
				email: config.test_tenant_email,
			},
		});
	}
};

export const seedTestOwner = async () => {
	try {
		const isTestOwnerExists = await prisma.user.findFirst({
			where: {
				role: Role.OWNER,
			},
		});

		if (isTestOwnerExists) {
			console.log("Test Owner Already Exists.");
			return;
		}
		const name = config.test_owner_name;
		const email = config.test_owner_email;
		const password = config.test_owner_password;

		if (!name || !email || !password) {
			throw new Error("Test Owner Details Missing in .env file.");
		}

		const hashedPassword = await bcrypt.hash(
			password,
			Number(config.bcrypt_salt_rounds),
		);

		const testOwner = await prisma.user.create({
			data: {
				name,
				email,
				password: hashedPassword,
				role: Role.OWNER,
				needPasswordChange: false,
				emailVerified: true,
				owner: {
					create: {
						name,
						email,
					},
				},
			},
		});

		console.log("Test Owner Created: ", testOwner);
	} catch (error) {
		console.log("Error Seeding Test Owner : ", error);

		await prisma.user.delete({
			where: {
				email: config.test_owner_email,
			},
		});
	}
};

export const seedTestProperty = async () => {
	try {
		const owner = await prisma.owner.findUnique({
			where: { email: config.test_owner_email },
			include: { property: true },
		});

		if (!owner) {
			throw new Error("Test owner must be seeded before test property data.");
		}

		const property =
			owner.property ??
			(await prisma.property.create({
				data: {
					name: "Algo Test Residence",
					address: "House 10, Road 5, Dhanmondi, Dhaka",
					owner: { connect: { id: owner.id } },
				},
			}));

		await prisma.unit.upsert({
			where: {
				propertyId_unitNo: { propertyId: property.id, unitNo: "A-101" },
			},
			update: {},
			create: {
				unitNo: "A-101",
				type: UnitType.ROOM,
				floor: 1,
				lengthFt: 12,
				widthFt: 10,
				occupancyLimit: 3,
				propertyId: property.id,
				monthlyRent: 5500,
				securityDepositAmount: 11000,
				status: UnitStatus.VACANT,
			},
		});

		await prisma.unit.upsert({
			where: {
				propertyId_unitNo: { propertyId: property.id, unitNo: "A-102" },
			},
			update: {},
			create: {
				unitNo: "A-102",
				type: UnitType.ROOM,
				floor: 1,
				lengthFt: 14,
				widthFt: 11,
				occupancyLimit: 4,
				propertyId: property.id,
				monthlyRent: 7000,
				securityDepositAmount: 14000,
				status: UnitStatus.VACANT,
			},
		});

		console.log("Test Property and Units Seeded.");
	} catch (error) {
		console.log("Error Seeding Test Property : ", error);
	}
};
