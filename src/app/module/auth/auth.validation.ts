import z from "zod";

const TenantLoginZodSchema = z.object({
	email: z.email(),
	password: z
		.string()
		.min(8, { message: "Password must be at least 8 characters long" })
		.max(32, { message: "Password must not exceed 32 characters" })
		.regex(/[A-Z]/, {
			message: "Password must contain at least one uppercase letter",
		})
		.regex(/[a-z]/, {
			message: "Password must contain at least one lowercase letter",
		})
		.regex(/[0-9]/, { message: "Password must contain at least one number" })
		.regex(/[^A-Za-z0-9]/, {
			message: "Password must contain at least one special character",
		}),
});

const TenantRegistrationZodSchema = z.object({
	name: z
		.string("Name should be a string")
		.min(3, "Name must be atleast 3 Chars long")
		.max(10, "Name cannot more than 10 chars"),
	email: z.email(),
	password: z
		.string()
		.min(8, { message: "Password must be at least 8 characters long" })
		.max(32, { message: "Password must not exceed 32 characters" })
		.regex(/[A-Z]/, {
			message: "Password must contain at least one uppercase letter",
		})
		.regex(/[a-z]/, {
			message: "Password must contain at least one lowercase letter",
		})
		.regex(/[0-9]/, { message: "Password must contain at least one number" })
		.regex(/[^A-Za-z0-9]/, {
			message: "Password must contain at least one special character",
		}),
	tenant: z
		.object({
			contactNumber: z
				.string()
				.regex(/^\d{11}$/, {
					message: "Contact number must be exactly 11 digits",
				})
				.optional(),
			nidNumber: z
				.string()
				.regex(/^\d{10}$/, {
					message: "NID number must be exactly 10 digits",
				})
				.optional(),
			presentAddress: z.string().optional(),
		})
		.optional(),
});

const ForgotPasswordZodSchema = z.object({
	email: z.email(),
});

const ResetPasswordZodSchema = z.object({
	email: z.email(),
	newPassword: z
		.string()
		.min(8, { message: "Password must be at least 8 characters long" })
		.max(32, { message: "Password must not exceed 32 characters" })
		.regex(/[A-Z]/, {
			message: "Password must contain at least one uppercase letter",
		})
		.regex(/[a-z]/, {
			message: "Password must contain at least one lowercase letter",
		})
		.regex(/[0-9]/, { message: "Password must contain at least one number" })
		.regex(/[^A-Za-z0-9]/, {
			message: "Password must contain at least one special character",
		}),
	otp: z.string().length(6, "OTP must be of 6 chars."),
});

const UserEmailVerificationZodSchema = z.object({
	email: z.email(),
	otp: z.string().length(6, "OTP must be of 6 chars."),
});

export const UserValidation = {
	TenantRegistrationZodSchema,
	TenantLoginZodSchema,
	ForgotPasswordZodSchema,
	ResetPasswordZodSchema,
	UserEmailVerificationZodSchema,
};
