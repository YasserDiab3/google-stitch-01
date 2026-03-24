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
import {
  closePermitToWork,
  createPermitToWorkWorkflow,
  decidePermitToWork,
  exportPermitToWork,
  listPermitNotifications,
  listPermitsToWorkRows,
  openPermitToWork
} from "../services/permit-workflow.js";

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
    const data =
      moduleKey === "permitsToWork" ? await listPermitsToWorkRows() : await listModuleRows(moduleKey);
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
    const data =
      moduleKey === "permitsToWork"
        ? await createPermitToWorkWorkflow(authRequest.authUser, request.body)
        : await createModuleRow(moduleKey, request.body);
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
    if (moduleKey === "permitsToWork") {
      response.status(405).json({ error: "Use workflow actions for permits to work" });
      return;
    }
    const data = await updateModuleRow(moduleKey, request.params.id, request.body);
    response.json({ moduleKey, data });
  } catch (error) {
    next(error);
  }
});

modulesRouter.post("/permitsToWork/:id/open", async (request, response, next) => {
  try {
    const authRequest = request as unknown as AuthenticatedRequest;
    if (!roleCanAccessModule(authRequest.authUser.role, "permitsToWork")) {
      response.status(403).json({ error: "Access denied for this module" });
      return;
    }

    const data = await openPermitToWork(authRequest.authUser, request.params.id);
    response.json({ moduleKey: "permitsToWork", data });
  } catch (error) {
    next(error);
  }
});

modulesRouter.post("/permitsToWork/:id/decision", async (request, response, next) => {
  try {
    const authRequest = request as unknown as AuthenticatedRequest;
    if (!roleCanAccessModule(authRequest.authUser.role, "permitsToWork")) {
      response.status(403).json({ error: "Access denied for this module" });
      return;
    }

    const action = request.body?.action;
    if (action !== "approve" && action !== "reject") {
      response.status(400).json({ error: "Decision action must be approve or reject" });
      return;
    }

    const data = await decidePermitToWork(
      authRequest.authUser,
      request.params.id,
      action,
      request.body?.comment
    );
    response.json({ moduleKey: "permitsToWork", data });
  } catch (error) {
    next(error);
  }
});

modulesRouter.post("/permitsToWork/:id/close", async (request, response, next) => {
  try {
    const authRequest = request as unknown as AuthenticatedRequest;
    if (!roleCanAccessModule(authRequest.authUser.role, "permitsToWork")) {
      response.status(403).json({ error: "Access denied for this module" });
      return;
    }

    const data = await closePermitToWork(authRequest.authUser, request.params.id);
    response.json({ moduleKey: "permitsToWork", data });
  } catch (error) {
    next(error);
  }
});

modulesRouter.get("/permitsToWork/:id/export", async (request, response, next) => {
  try {
    const authRequest = request as unknown as AuthenticatedRequest;
    if (!roleCanAccessModule(authRequest.authUser.role, "permitsToWork")) {
      response.status(403).json({ error: "Access denied for this module" });
      return;
    }

    const file = await exportPermitToWork(authRequest.authUser, request.params.id);
    response.setHeader("Content-Type", "text/csv; charset=utf-8");
    response.setHeader("Content-Disposition", `attachment; filename=\"${file.filename}\"`);
    response.send(file.content);
  } catch (error) {
    next(error);
  }
});

modulesRouter.get("/permitsToWork/:id/notifications", async (request, response, next) => {
  try {
    const authRequest = request as unknown as AuthenticatedRequest;
    if (!roleCanAccessModule(authRequest.authUser.role, "permitsToWork")) {
      response.status(403).json({ error: "Access denied for this module" });
      return;
    }

    const data = await listPermitNotifications(request.params.id);
    response.json({ moduleKey: "permitsToWork", data });
  } catch (error) {
    next(error);
  }
});
