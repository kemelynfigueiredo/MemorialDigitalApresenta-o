import { Router } from "express";

import { upload } from "../config/upload.js";
import {
  createMemorial,
  deleteMemorial,
  getMemorialById,
  listMemoriais,
  updateMemorial,
} from "../controllers/memorialController.js";
import { authenticateAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/", listMemoriais);
router.get("/:id", getMemorialById);
router.post(
  "/",
  authenticateAdmin,
  upload.fields([
    { name: "imagem", maxCount: 1 },
    { name: "galeria", maxCount: 10 },
  ]),
  createMemorial
);
router.put(
  "/:id",
  authenticateAdmin,
  upload.fields([
    { name: "imagem", maxCount: 1 },
    { name: "galeria", maxCount: 10 },
  ]),
  updateMemorial
);
router.delete("/:id", authenticateAdmin, deleteMemorial);

export default router;
