import { FastifyInstance } from "fastify";
import { userController } from "@/controllers/user.controller";
import { authController } from "@/controllers/auth.controller";
import { UserRouteSchemas, AuthRouteSchemas } from "@/schemas/user.schema";

export async function userRoutes(app: FastifyInstance) {
    // Auth routes with OTP verification
    app.post("/auth/register", { schema: AuthRouteSchemas.register }, authController.register);
    app.post("/auth/verify-otp", { schema: AuthRouteSchemas.verifyOtp }, authController.verifyOtp);
    app.post("/auth/resend-otp", { schema: AuthRouteSchemas.resendOtp }, authController.resendOtp);
    app.post("/auth/login", { schema: AuthRouteSchemas.login }, authController.login);

    // Current user routes
    app.get("/users/me", { schema: UserRouteSchemas.getMe }, userController.getMe);

    // User CRUD routes
    app.get("/users", { schema: UserRouteSchemas.list }, userController.list);
    app.get("/users/stats", { schema: UserRouteSchemas.getStats }, userController.getStats);
    app.get("/users/exists", { schema: UserRouteSchemas.checkExists }, userController.checkExists);
    app.get("/users/:id", { schema: UserRouteSchemas.getById }, userController.getById);
    app.patch("/users/:id", { schema: UserRouteSchemas.update }, userController.update);
    app.delete("/users/:id", { schema: UserRouteSchemas.delete }, userController.delete);

    // Password routes
    app.patch("/users/:id/password", { schema: UserRouteSchemas.updatePassword }, userController.updatePassword);

    // Admin actions
    app.patch("/users/:id/block", { schema: UserRouteSchemas.block }, userController.block);
    app.patch("/users/:id/unblock", { schema: UserRouteSchemas.unblock }, userController.unblock);
    app.patch("/users/:id/verify", { schema: UserRouteSchemas.verify }, userController.verify);
    app.patch("/users/:id/role", { schema: UserRouteSchemas.updateRole }, userController.updateRole);

    // Profile routes
    app.get("/users/:id/profile", { schema: UserRouteSchemas.getProfile }, userController.getProfile);
    app.put("/users/:id/profile", { schema: UserRouteSchemas.upsertProfile }, userController.upsertProfile);

    // KYC routes
    app.post("/users/:id/kyc/aadhar", { schema: UserRouteSchemas.submitAadharKyc }, userController.submitAadharKyc);
    app.post("/users/:id/kyc/pan", { schema: UserRouteSchemas.submitPanKyc }, userController.submitPanKyc);
    app.get("/users/:id/kyc", { schema: UserRouteSchemas.getKycStatus }, userController.getKycStatus);
    app.patch("/users/:id/kyc/verify", { schema: UserRouteSchemas.verifyKyc }, userController.verifyKyc);
}
