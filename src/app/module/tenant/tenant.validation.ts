import z from "zod";

const TenantNidZodSchema = z.object({
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

const nidVerificationSchema = z.object({
	nidNumber: z
		.string()
		.regex(/^\d{10}$/, "NID Number must be exactly 10 digits."),
});

export const TenantValidation = {
	nidVerificationSchema,
};
