import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { upload } from "../../lib/multer";
import { auth } from "../../middleware/checkAuth";
import zodValidation from "../../middleware/zodValidation";
import { UserController } from "./tenant.controller";
import { TenantValidation } from "./tenant.validation";

const router = Router();

router.patch(
	"/profile-image",
	auth(Role.SUPER_ADMIN, Role.ADMIN, Role.OWNER, Role.TENANT),
	upload.single("profileImage"),
	UserController.uploadProfileImage,
);

router.patch(
	"/nid",
	auth(Role.ADMIN, Role.TENANT),
	upload.single("nid"),
	zodValidation(TenantValidation.nidVerificationSchema),
	UserController.uploadNid,
);

export const TenantRoutes = router;
