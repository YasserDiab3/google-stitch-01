import { Router } from "express";
import { z } from "zod";
import { moduleCatalog, modules, roleCanAccessModule, type ModuleKey } from "../config/modules.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import {
  createModuleRow,
  findEmployeeByCode,
  getModuleRow,
  listModuleRows,
  updateModuleRow
} from "../services/module-service.js";
import {
  closePermitToWork,
  createPermitToWorkWorkflow,
  decidePermitToWork,
  exportPermitToWork,
  getPermitWorkflowMetadata,
  listPermitNotifications,
  listPermitsToWorkRows,
  openPermitToWork
} from "../services/permit-workflow.js";
import {
  createManagedUser,
  listManagedUsers,
  updateManagedUser
} from "../services/user-management.js";

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

modulesRouter.get("/clinic/employee/:employeeCode", async (request, response, next) => {
  try {
    const authRequest = request as unknown as AuthenticatedRequest;
    if (!roleCanAccessModule(authRequest.authUser.role, "clinic")) {
      response.status(403).json({ error: "Access denied for this module" });
      return;
    }

    const data = await findEmployeeByCode(request.params.employeeCode);
    response.json({ moduleKey: "clinic", data });
  } catch (error) {
    next(error);
  }
});

modulesRouter.get("/permitsToWork/meta/options", async (request, response, next) => {
  try {
    const authRequest = request as unknown as AuthenticatedRequest;
    if (!roleCanAccessModule(authRequest.authUser.role, "permitsToWork")) {
      response.status(403).json({ error: "Access denied for this module" });
      return;
    }

    const data = await getPermitWorkflowMetadata();
    response.json({ moduleKey: "permitsToWork", data });
  } catch (error) {
    next(error);
  }
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
      moduleKey === "permitsToWork"
        ? await listPermitsToWorkRows()
        : moduleKey === "users"
          ? await listManagedUsers()
          : await listModuleRows(moduleKey);
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
        : moduleKey === "users"
          ? await createManagedUser({
              email: request.body?.email,
              password: request.body?.password,
              fullName: request.body?.full_name,
              role: request.body?.role,
              department: request.body?.department,
              locale: request.body?.locale,
              isActive: request.body?.is_active
            })
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
    const data =
      moduleKey === "users"
        ? await updateManagedUser(request.params.id, {
            fullName: request.body?.full_name,
            role: request.body?.role,
            department: request.body?.department,
            locale: request.body?.locale,
            isActive: request.body?.is_active
          })
        : await updateModuleRow(moduleKey, request.params.id, request.body);
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
