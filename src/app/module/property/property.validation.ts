import z from "zod";

const PropertyAssignOwnerZodSchema = z.object({
	ownerId: z.string(),
	propertyId: z.string(),
});

export const PropertyValidation = {
	PropertyAssignOwnerZodSchema,
};
