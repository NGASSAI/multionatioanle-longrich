import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import { env, isProd } from "./config/env.js";
import routes from "./routes/index.js";
import { notFoundHandler, errorHandler } from "./middlewares/errorHandler.js";
import { generateSitemap } from "./services/sitemapService.js";

export const app = express();

app.set("trust proxy", 1);

// Configuration Helmet assouplie en dev
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

// CORS : Autorise sans condition en developpement, strict en production
app.use(
  cors({
    origin: isProd ? env.CLIENT_URL : true,
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(isProd ? "combined" : "dev"));
app.get("/sitemap.xml", async (req, res, next) => {
  try {
    const xml = await generateSitemap();
    res.header("Content-Type", "application/xml");
    res.send(xml);
  } catch (err) {
    next(err);
  }
});

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler); // doit rester le dernier middleware monte