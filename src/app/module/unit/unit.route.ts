import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { UnitController } from "./unit.controller";

const router = Router();

router.get(
	"/",
	auth(Role.ADMIN, Role.OWNER, Role.SUPER_ADMIN),
	UnitController.getAllUnits,
);

router.post("/", auth(Role.OWNER, Role.SUPER_ADMIN), UnitController.createUnit);

router.put("/", auth(Role.OWNER, Role.SUPER_ADMIN), UnitController.updateUnit);

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
