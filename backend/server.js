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
// PORT should be assigned after calling dotenv.config() because we need to access the env variables. Didn't realize while recording the video. Sorry for the confusion.
const PORT = process.env.PORT || 80;

app.use(
	cors({
		origin: true,
		credentials: true,
	})
);
app.use(express.json()); // to parse the incoming requests with JSON payloads (from req.body)
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);

// Статические файлы для загруженных изображений и аудио (ВАЖНО: до frontend static)
// Путь: uploads (в dist на Amvera, backend/uploads локально)
app.use("/uploads", express.static(path.join(__dirname, "uploads"), {
	setHeaders: (res, filePath) => {
		// Устанавливаем правильные заголовки для аудио/видео файлов
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
