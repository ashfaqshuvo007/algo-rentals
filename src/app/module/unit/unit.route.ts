import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import zodQueryValidation from "../../middleware/zodQueryValidation";
import zodValidation from "../../middleware/zodValidation";
import { UnitController } from "./unit.controller";
import { UnitValidation } from "./unit.validation";

const router = Router();

router.get(
	"/",
	auth(Role.ADMIN, Role.OWNER, Role.SUPER_ADMIN),
	zodQueryValidation(UnitValidation.getAllUnitsSchema),
	UnitController.getAllUnits,
);

router.post(
	"/",
	auth(Role.OWNER, Role.ADMIN),
	zodValidation(UnitValidation.createUnitSchema),
	UnitController.createUnit,
);

router.patch(
	"/:unitId",
	auth(Role.OWNER, Role.SUPER_ADMIN, Role.ADMIN),
	zodValidation(UnitValidation.updateUnitSchema),
	UnitController.updateUnit,
);

router.get(
	"/:unitId",
	auth(Role.ADMIN, Role.OWNER, Role.SUPER_ADMIN),
	UnitController.getSingleUnit,
);
router.get(
	"/:unitId/tenants",
	auth(Role.ADMIN, Role.OWNER, Role.SUPER_ADMIN),
	UnitController.getUnitTenants,
);

export const UnitRoutes = router;
