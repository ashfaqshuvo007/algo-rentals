import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import zodValidation from "../../middleware/zodValidation";
import { AuthController } from "./auth.controller";
import { UserValidation } from "./auth.validation";

const router = Router();

router.post(
	"/register",
	zodValidation(UserValidation.TenantRegistrationZodSchema),
	AuthController.registerTenant,
);
router.post(
	"/login",
	zodValidation(UserValidation.TenantLoginZodSchema),
	AuthController.loginUser,
);
router.get(
	"/me",
	auth(Role.ADMIN, Role.OWNER, Role.TENANT, Role.SUPER_ADMIN),
	AuthController.getMe,
);
router.post("/refresh-token", AuthController.refreshToken);
router.post("/google", AuthController.googleAuth);
router.post(
	"/forgot-password",
	zodValidation(UserValidation.ForgotPasswordZodSchema),
	AuthController.forgotPassword,
);
router.post(
	"/reset-password",
	zodValidation(UserValidation.ResetPasswordZodSchema),
	AuthController.resetPassword,
);
router.post(
	"/verify-email",
	zodValidation(UserValidation.UserEmailVerificationZodSchema),
	AuthController.verifyUserEmail,
);
export const AuthRoutes = router;
