import express from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes";
import { db, pool } from "./db/index";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = parseInt(process.env.PORT || "5000", 10);

// Trust proxy (Replit reverse proxy)
app.set("trust proxy", 1);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Session middleware (PostgreSQL-backed)
const PgStore = connectPgSimple(session);
app.use(
  session({
    store: new PgStore({
      pool,
      tableName: "session",
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || "consoleblue-dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      domain: process.env.COOKIE_DOMAIN || undefined,
    },
  }),
);

// Register all API routes (before static files / vite)
registerRoutes(app, db);

async function startServer() {
  if (process.env.NODE_ENV === "production") {
    const publicDir = path.resolve(__dirname, "public");
    console.log(`[server] Serving static files from: ${publicDir}`);
    app.use(express.static(publicDir));
    app.get("*", (_req, res, next) => {
      if (_req.path.startsWith("/api/")) return next();
      res.sendFile(path.join(publicDir, "index.html"));
    });
  } else {
    // Development: use Vite as middleware
    const { createServer } = await import("vite");
    const vite = await createServer({
      configFile: path.resolve(__dirname, "..", "vite.config.ts"),
      server: {
        middlewareMode: true,
        hmr: { server: undefined },
        allowedHosts: true,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[server] ConsoleBlue running on port ${PORT}`);
    console.log(
      `[server] Environment: ${process.env.NODE_ENV || "development"}`,
    );
  });
}

startServer();

export default app;
