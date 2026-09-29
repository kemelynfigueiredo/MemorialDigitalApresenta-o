import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import prisma from "../lib/prisma.js";

const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;
const loginAttempts = new Map();
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;

if (!JWT_SECRET || !ADMIN_EMAIL || !ADMIN_PASSWORD_HASH) {
  throw new Error("JWT_SECRET, ADMIN_EMAIL e ADMIN_PASSWORD_HASH devem ser configurados.");
}

export async function healthCheck(req, res) {
  try {
    const quantidade = await prisma.memorial.count();

    return res.json({
      bancoConectado: true,
      quantidadeDeMemoriais: quantidade,
    });
  } catch (error) {
    console.error("Erro ao acessar o banco:", error);

    return res.status(500).json({
      bancoConectado: false,
      erro: error.message,
    });
  }
}

export async function login(req, res) {
  const { email, password } = req.body;
  const ip = req.ip;
  const now = Date.now();
  const attempts = loginAttempts.get(ip);

  if (attempts && now - attempts.firstAttempt < LOGIN_WINDOW_MS) {
    if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
      const retryAfter = Math.ceil((LOGIN_WINDOW_MS - (now - attempts.firstAttempt)) / 1000);
      res.set("Retry-After", String(retryAfter));
      return res.status(429).json({ message: "Muitas tentativas. Tente novamente mais tarde." });
    }
  } else if (attempts) {
    loginAttempts.delete(ip);
  }

  const passwordMatches = typeof password === "string"
    && await bcrypt.compare(password, ADMIN_PASSWORD_HASH);

  if (email === ADMIN_EMAIL && passwordMatches) {
    loginAttempts.delete(ip);
    const token = jwt.sign(
      { email, role: "admin" },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.json({
      success: true,
      token,
    });
  }

  const currentAttempts = loginAttempts.get(ip);
  loginAttempts.set(ip, {
    count: (currentAttempts?.count || 0) + 1,
    firstAttempt: currentAttempts?.firstAttempt || now,
  });

  return res.status(401).json({
    success: false,
    message: "Credenciais inválidas.",
  });
}
