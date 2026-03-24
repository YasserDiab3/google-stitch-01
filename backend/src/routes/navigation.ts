import { Router } from "express";
import { getAllowedScreens, modules, roleLabels, roleCanAccessModule } from "../config/modules.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";

export const navigationRouter = Router();

navigationRouter.use(requireAuth);

navigationRouter.get("/screens", (request, response) => {
  const authRequest = request as unknown as AuthenticatedRequest;
  const allowedScreens = getAllowedScreens(authRequest.authUser.role);

  response.json({
    user: {
      ...authRequest.authUser,
      roleLabel: roleLabels[authRequest.authUser.role]
    },
    screens: allowedScreens
  });
});

navigationRouter.get("/modules", (request, response) => {
  const authRequest = request as unknown as AuthenticatedRequest;
  const allowedModules = modules.filter((moduleItem) =>
    roleCanAccessModule(authRequest.authUser.role, moduleItem.key)
  );

  response.json({
    modules: allowedModules
  });
});
