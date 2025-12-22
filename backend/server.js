import path from "path";
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import messageRoutes from "./routes/message.routes.js";
import userRoutes from "./routes/user.routes.js";

import connectToMongoDB from "./db/connectToMongoDB.js";
import { app, server } from "./socket/socket.js";

dotenv.config();

const __dirname = path.resolve();

const PORT = process.env.PORT || 80;

app.use(
	cors({
		origin: true,
		credentials: true,
	})
);
app.use(express.json()); 
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);


app.use("/uploads", express.static(path.join(__dirname, "../backend/uploads"), {
	setHeaders: (res, filePath) => {
		if (filePath.endsWith('.webm')) {
			res.setHeader('Content-Type', 'audio/webm');
		} else if (filePath.endsWith('.ogg')) {
			res.setHeader('Content-Type', 'audio/ogg');
		} else if (filePath.endsWith('.mp3')) {
		} else if (filePath.endsWith('.wav')) {
			res.setHeader('Content-Type', 'audio/wav');
		}
		res.setHeader('Accept-Ranges', 'bytes');
	}
}));

app.use(express.static(path.join(__dirname, "/frontend/dist")));

app.get("*", (req, res) => {
	res.sendFile(path.join(__dirname, "frontend", "dist", "index.html"));
});

server.listen(PORT, () => {
	connectToMongoDB();
	console.log(`Сервер запущен на порте ${PORT}`);
});
