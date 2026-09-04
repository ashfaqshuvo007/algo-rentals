import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import zodValidation from "../../middleware/zodValidation";
import { PropertyController } from "./property.controller";
import { PropertyValidation } from "./property.validation";

const router = Router();

router.get(
	"/",
	auth(Role.ADMIN, Role.SUPER_ADMIN),
	PropertyController.getAllProperties,
);

router.get(
	"/my-properties",
	auth(Role.OWNER),
	PropertyController.getMyProperties,
);

router.get(
	"/:propertyId",
	auth(Role.ADMIN, Role.SUPER_ADMIN),
	PropertyController.getSingleProperty,
);

router.post(
	"/",
	auth(Role.ADMIN, Role.OWNER, Role.SUPER_ADMIN),
	PropertyController.createProperty,
);

router.patch(
	"/assign-owner",
	auth(Role.ADMIN, Role.SUPER_ADMIN),
	zodValidation(PropertyValidation.PropertyAssignOwnerZodSchema),
	PropertyController.assignPropertyToOwner,
);

export const PropertyRoutes = router;
