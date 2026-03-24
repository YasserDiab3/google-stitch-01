import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import pino from "pino";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFoundHandler } from "./middleware/not-found.js";
import { authRouter } from "./routes/auth.js";
import { healthRouter } from "./routes/health.js";
import { modulesRouter } from "./routes/modules.js";
import { navigationRouter } from "./routes/navigation.js";

const logger = pino({
  level: env.NODE_ENV === "production" ? "info" : "debug"
});

const app = express();

app.use((request, _response, next) => {
  logger.info(
    {
      method: request.method,
      path: request.originalUrl
    },
    "incoming request"
  );
  next();
});
app.use(helmet());
app.use(compression());
app.use(
  cors({
    origin: env.CORS_ORIGIN.split(",").map((origin) => origin.trim()),
    credentials: true
  })
);
app.use(express.json({ limit: "2mb" }));

app.get("/", (_request, response) => {
  response.json({
    name: "ehs-system-api",
    environment: env.NODE_ENV
  });
});

app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/navigation", navigationRouter);
app.use("/api/modules", modulesRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export function createApp() {
  return app;
}

export default app;
