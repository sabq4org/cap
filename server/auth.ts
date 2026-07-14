import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { randomBytes } from "crypto";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week in ms
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: Math.floor(sessionTtl / 1000),
    tableName: "sessions",
  });
  let secret = process.env.SESSION_SECRET;
  if (!secret) {
    console.warn(
      "[Auth] SESSION_SECRET is not set — using a temporary random secret. Set SESSION_SECRET in the environment.",
    );
    secret = randomBytes(32).toString("hex");
  }
  return session({
    secret,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  // Local email/password + admin-session only (no third-party OIDC).
  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      req.session?.destroy(() => {
        res.clearCookie("connect.sid");
        res.redirect("/");
      });
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // Admin panel sessions are always authenticated - inject synthetic user
  if ((req.session as any).adminAuthenticated) {
    if (!req.user) {
      (req as any).user = {
        claims: { sub: "admin" },
        localAuth: true,
      };
    }
    return next();
  }

  const user = req.user as any;

  if (!req.isAuthenticated() || !user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Local auth users only
  if (user.localAuth === true) {
    return next();
  }

  return res.status(401).json({ message: "Unauthorized" });
};
