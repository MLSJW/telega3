import express from "express";
import protectRoute from "../middleware/protectRoute.js";
import { getUsersForSidebar, deleteMyAccount, updateMyProfile } from "../controllers/user.controller.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.get("/", protectRoute, getUsersForSidebar);

router.patch("/me", protectRoute, upload.single("profilePic"), updateMyProfile);

router.delete("/me", protectRoute, deleteMyAccount);

export default router;
