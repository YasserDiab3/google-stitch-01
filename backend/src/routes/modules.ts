import { Router } from "express";
import { z } from "zod";
import { moduleCatalog, modules, roleCanAccessModule, type ModuleKey } from "../config/modules.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import {
  createModuleRow,
  getModuleRow,
  listModuleRows,
  updateModuleRow
} from "../services/module-service.js";

export const modulesRouter = Router();

const moduleParamSchema = z.enum(Object.keys(moduleCatalog) as [ModuleKey, ...ModuleKey[]]);

modulesRouter.use(requireAuth);

modulesRouter.get("/", (request, response) => {
  const authRequest = request as unknown as AuthenticatedRequest;
  response.json({
    modules: modules.filter((moduleItem) =>
      roleCanAccessModule(authRequest.authUser.role, moduleItem.key)
    )
  });
});

modulesRouter.get("/:moduleKey", async (request, response, next) => {
  try {
    const authRequest = request as unknown as AuthenticatedRequest;
    const moduleKey = moduleParamSchema.parse(request.params.moduleKey);
    if (!roleCanAccessModule(authRequest.authUser.role, moduleKey)) {
      response.status(403).json({ error: "Access denied for this module" });
      return;
    }
    const data = await listModuleRows(moduleKey);
    response.json({ moduleKey, data });
  } catch (error) {
    next(error);
  }
});

modulesRouter.get("/:moduleKey/:id", async (request, response, next) => {
  try {
    const authRequest = request as unknown as AuthenticatedRequest;
    const moduleKey = moduleParamSchema.parse(request.params.moduleKey);
    if (!roleCanAccessModule(authRequest.authUser.role, moduleKey)) {
      response.status(403).json({ error: "Access denied for this module" });
      return;
    }
    const data = await getModuleRow(moduleKey, request.params.id);
    response.json({ moduleKey, data });
  } catch (error) {
    next(error);
  }
});

modulesRouter.post("/:moduleKey", async (request, response, next) => {
  try {
    const authRequest = request as unknown as AuthenticatedRequest;
    const moduleKey = moduleParamSchema.parse(request.params.moduleKey);
    if (!roleCanAccessModule(authRequest.authUser.role, moduleKey)) {
      response.status(403).json({ error: "Access denied for this module" });
      return;
    }
    const data = await createModuleRow(moduleKey, request.body);
    response.status(201).json({ moduleKey, data });
  } catch (error) {
    next(error);
  }
});

modulesRouter.patch("/:moduleKey/:id", async (request, response, next) => {
  try {
    const authRequest = request as unknown as AuthenticatedRequest;
    const moduleKey = moduleParamSchema.parse(request.params.moduleKey);
    if (!roleCanAccessModule(authRequest.authUser.role, moduleKey)) {
      response.status(403).json({ error: "Access denied for this module" });
      return;
    }
    const data = await updateModuleRow(moduleKey, request.params.id, request.body);
    response.json({ moduleKey, data });
  } catch (error) {
    next(error);
  }
});
