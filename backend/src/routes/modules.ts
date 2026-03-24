import { Router } from "express";
import { z } from "zod";
import { moduleTableMap, modules, type ModuleKey } from "../config/modules.js";
import {
  createModuleRow,
  getModuleRow,
  listModuleRows,
  updateModuleRow
} from "../services/module-service.js";

export const modulesRouter = Router();

const moduleParamSchema = z.enum(Object.keys(moduleTableMap) as [ModuleKey, ...ModuleKey[]]);

modulesRouter.get("/", (_request, response) => {
  response.json({ modules });
});

modulesRouter.get("/:moduleKey", async (request, response, next) => {
  try {
    const moduleKey = moduleParamSchema.parse(request.params.moduleKey);
    const data = await listModuleRows(moduleKey);
    response.json({ moduleKey, data });
  } catch (error) {
    next(error);
  }
});

modulesRouter.get("/:moduleKey/:id", async (request, response, next) => {
  try {
    const moduleKey = moduleParamSchema.parse(request.params.moduleKey);
    const data = await getModuleRow(moduleKey, request.params.id);
    response.json({ moduleKey, data });
  } catch (error) {
    next(error);
  }
});

modulesRouter.post("/:moduleKey", async (request, response, next) => {
  try {
    const moduleKey = moduleParamSchema.parse(request.params.moduleKey);
    const data = await createModuleRow(moduleKey, request.body);
    response.status(201).json({ moduleKey, data });
  } catch (error) {
    next(error);
  }
});

modulesRouter.patch("/:moduleKey/:id", async (request, response, next) => {
  try {
    const moduleKey = moduleParamSchema.parse(request.params.moduleKey);
    const data = await updateModuleRow(moduleKey, request.params.id, request.body);
    response.json({ moduleKey, data });
  } catch (error) {
    next(error);
  }
});
