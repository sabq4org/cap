import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import type { Express } from "express";

export function setupLocalAuth(app: Express) {
  passport.use(
    "local",
    new LocalStrategy(
      { usernameField: "email", passwordField: "password" },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email.toLowerCase().trim());
          if (!user) {
            return done(null, false, { message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
          }
          if (!user.isActive) {
            return done(null, false, { message: "الحساب معطّل. تواصل مع الدعم." });
          }
          if (!user.passwordHash) {
            return done(null, false, { message: "هذا الحساب يستخدم طريقة دخول مختلفة" });
          }
          const valid = await bcrypt.compare(password, user.passwordHash);
          if (!valid) {
            return done(null, false, { message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
          }
          await storage.updateUserLastLogin(user.id);
          const sessionUser = buildLocalSessionUser(user);
          return done(null, sessionUser);
        } catch (err) {
          return done(err);
        }
      }
    )
  );
}

export function buildLocalSessionUser(user: any) {
  return {
    id: user.id,
    localAuth: true,
    expires_at: Math.floor(Date.now() / 1000) + 7 * 24 * 3600,
    claims: {
      sub: user.id,
      email: user.email,
      first_name: user.firstName,
      last_name: user.lastName,
      profile_image_url: user.profileImageUrl,
    },
  };
}

export function registerLocalAuthRoutes(app: Express) {
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password || !firstName) {
        return res.status(400).json({ message: "يرجى ملء جميع الحقول المطلوبة" });
      }
      if (password.length < 6) {
        return res.status(400).json({ message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "البريد الإلكتروني غير صحيح" });
      }

      const existing = await storage.getUserByEmail(email.toLowerCase().trim());
      if (existing) {
        return res.status(409).json({ message: "هذا البريد الإلكتروني مسجّل مسبقاً" });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const user = await storage.createLocalUser({
        email: email.toLowerCase().trim(),
        passwordHash,
        firstName: firstName.trim(),
        lastName: lastName?.trim() || null,
        authProvider: "local",
      });

      const sessionUser = buildLocalSessionUser(user);
      req.logIn(sessionUser, (err) => {
        if (err) {
          console.error("Login after register failed:", err);
          return res.status(500).json({ message: "حدث خطأ أثناء تسجيل الدخول" });
        }
        res.status(201).json({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        });
      });
    } catch (err) {
      console.error("Register error:", err);
      res.status(500).json({ message: "حدث خطأ في الخادم" });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        console.error("Login error:", err);
        return res.status(500).json({ message: "حدث خطأ في الخادم" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
      }
      req.logIn(user, (loginErr) => {
        if (loginErr) {
          return res.status(500).json({ message: "حدث خطأ أثناء تسجيل الدخول" });
        }
        return res.json({
          id: user.id,
          email: user.claims.email,
          firstName: user.claims.first_name,
          lastName: user.claims.last_name,
          role: null,
        });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      req.session.destroy(() => {
        res.clearCookie("connect.sid");
        res.json({ success: true });
      });
    });
  });
}
