import type { Role } from "../../../generated/prisma/browser";

export interface ILoginUserPayload {
	email: string;
	password: string;
}

export interface IRegisterTenantPayload {
	name: string;
	email: string;
	password: string;
	tenant?: {
		nidNumber?: string;
		contactNumber?: string;
		presentAddress?: string;
	};
}

export interface IRequestUser {
	userId: string;
	email: string;
	name: string;
	role: Role;
}

export interface IGoogleLoginPayload {
	idToken: string;
}

export interface IForgotPasswordPayload {
	email: string;
}

export interface IResetPasswordPayload {
	email: string;
	newPassword: string;
	otp: string;
}

export interface IVerfiyUserEmailPayload {
	email: string;
	otp: string;
}
