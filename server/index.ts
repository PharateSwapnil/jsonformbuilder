import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use environment variable for port with fallback
  // Development: 5000, Production: 3000 (or specified PORT)
  const port = process.env.PORT
    ? parseInt(process.env.PORT)
    : process.env.NODE_ENV === "production"
      ? 3000
      : 5000;
  
  // Use 0.0.0.0 for external accessibility in Replit
  const host = "localhost";
  
  // Handle port conflicts gracefully
  server.listen(port, host, () => {
    log(
      `serving on port http://${host}:${port} (${process.env.NODE_ENV || "development"} mode)`,
    );
  }).on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      log(`Port ${port} is busy, trying port ${port + 1}...`);
      server.listen(port + 1, host, () => {
        log(
          `serving on port http://${host}:${port + 1} (${process.env.NODE_ENV || "development"} mode)`,
        );
      });
    } else {
      throw err;
    }
  });
})();
