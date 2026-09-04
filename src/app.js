import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";

import { env, isProd } from "./config/env.js";
import routes from "./routes/index.js";
import { notFoundHandler, errorHandler } from "./middlewares/errorHandler.js";

export const app = express();

// Nécessaire sur Render (reverse proxy) pour que req.ip et le rate limiting
// par IP reflètent la vraie IP du client plutôt que celle du proxy.
app.set("trust proxy", 1);

app.use(helmet());

// CORS strict : un seul domaine autorisé (le frontend), cookies inclus
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(isProd ? "combined" : "dev"));

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler); // doit rester le dernier middleware monté
