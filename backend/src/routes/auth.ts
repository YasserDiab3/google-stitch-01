import { Router } from "express";
import { supabaseAuth } from "../lib/supabase.js";

export const authRouter = Router();

authRouter.get("/me", async (request, response, next) => {
  try {
    const authorization = request.headers.authorization;
    const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;

    if (!token) {
      response.status(401).json({ error: "Missing bearer token" });
      return;
    }

    const { data, error } = await supabaseAuth.auth.getUser(token);
    if (error) throw error;

    response.json({ user: data.user });
  } catch (error) {
    next(error);
  }
});
