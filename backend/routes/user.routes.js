import express from "express";
import protectRoute from "../middleware/protectRoute.js";
import { getUsersForSidebar, deleteMyAccount, updateMyProfile } from "../controllers/user.controller.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.get("/", protectRoute, getUsersForSidebar);
// PATCH — обновить профиль, multipart/form-data (file=profilePic)
router.patch("/me", protectRoute, upload.single("profilePic"), updateMyProfile);
// DELETE — удалить себя
router.delete("/me", protectRoute, deleteMyAccount);

export default router;
