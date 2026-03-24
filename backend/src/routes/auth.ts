import { Router } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";

export const authRouter = Router();

authRouter.get("/me", requireAuth, async (request, response, next) => {
  try {
    const authRequest = request as AuthenticatedRequest;
    response.json({
      user: authRequest.authUser
    });
  } catch (error) {
    next(error);
  }
});
