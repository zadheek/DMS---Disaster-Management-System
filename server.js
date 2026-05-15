const { createServer } = require("node:http");
const { parse } = require("node:url");
const next = require("next");
const { Server } = require("socket.io");
const cron = require("node-cron");
const { getToken } = require("next-auth/jwt");

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

// Inline cookie parser so getToken receives an explicit cookies object.
// next-auth/jwt can fall back to req.headers.cookie but the socket handshake
// object shape differs from a Node IncomingMessage; be explicit to avoid
// silent token-parse failures on some next-auth versions.
function parseCookieHeader(cookieStr) {
  if (!cookieStr) return {};
  return Object.fromEntries(
    cookieStr.split(";").map((pair) => {
      const idx = pair.indexOf("=");
      return idx < 0
        ? [pair.trim(), ""]
        : [pair.slice(0, idx).trim(), decodeURIComponent(pair.slice(idx + 1).trim())];
    })
  );
}

// Custom Next.js server: required because Socket.IO and scheduled cleanup jobs
// need to run beside the normal Next.js request handler.
const app = next({ dev, hostname, port });

if (typeof Response !== 'undefined') {
    if (typeof Response.json !== 'function') {
        Response.json = (body, init = {}) => {
            return new Response(JSON.stringify(body), {
                headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
                ...init,
            });
        };
    }
}

const handler = app.getRequestHandler();

app.prepare().then(async () => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handler(req, res, parsedUrl);
    } catch (err) {
      console.error("Error handling request:", err);
      res.statusCode = 500;
      res.end("Internal server error");
    }
  });

  // Socket.IO is used for live public/admin updates: new alerts, map pins,
  // broadcasts, chat messages, and dashboard feed events.
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  // Make io available globally for API routes
  global.io = io;

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Admin-only realtime room. The JWT is read from the socket handshake so
    // public users cannot subscribe to private admin events.
    socket.on("join:admin", async () => {
      try {
        const token = await getToken({
          req: {
            headers: socket.handshake.headers,
            cookies: parseCookieHeader(socket.handshake.headers.cookie),
          },
          secret: process.env.NEXTAUTH_SECRET,
        });
        if (token && token.role === "ADMIN") {
          socket.join("admin");
        } else {
          console.warn("Unauthorized join:admin attempt:", socket.id);
        }
      } catch (err) {
        console.error("join:admin auth error:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  // Scheduled safety cleanup: expire stale alerts and broadcasts hourly so the
  // public view does not keep outdated emergency information.
  cron.schedule("0 * * * *", async () => {
    try {
      const { PrismaClient } = require("@prisma/client");
      const prisma =
        global.prismaInstance ||
        (global.prismaInstance = new PrismaClient());

      const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

      const expired = await prisma.alert.updateMany({
        where: {
          status: "ACTIVE",
          expiresAt: null,
          createdAt: { lt: fortyEightHoursAgo },
        },
        data: { status: "EXPIRED" },
      });

      if (expired.count > 0) {
        console.log(`Expired ${expired.count} alerts`);
        io.emit("alerts:updated");
      }

      const expiredBroadcasts = await prisma.broadcast.updateMany({
        where: {
          isActive: true,
          expiresAt: { lt: new Date() },
        },
        data: { isActive: false },
      });

      if (expiredBroadcasts.count > 0) {
        console.log(`Deactivated ${expiredBroadcasts.count} broadcasts`);
        io.emit("broadcasts:updated");
      }
    } catch (err) {
      console.error("Cron job error:", err);
    }
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
