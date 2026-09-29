import { Router } from "express";

import { healthCheck, login } from "../controllers/authController.js";

const router = Router();

router.get("/teste-banco", healthCheck);
router.post("/login", login);

export default router;
