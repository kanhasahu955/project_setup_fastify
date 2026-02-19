import { FastifyInstance } from "fastify";
import { userController } from "@/controllers/user.controller";
import { UserRouteSchemas } from "@/utils/swagger.util";

export async function userRoutes(app: FastifyInstance) {
    // Auth routes
    app.post("/auth/register", { schema: UserRouteSchemas.register }, userController.register);
    app.post("/auth/login", { schema: UserRouteSchemas.login }, userController.login);

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
}
