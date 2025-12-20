import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";
import crypto from "crypto";
import User from "../models/user.model.js";

const ALGORITHM = "rsa";
const KEY_FORMAT = "pem";

// Функция для шифрования
const encryptMessage = (message, publicKeyPem) => {
	const buffer = Buffer.from(message, "utf8");
	const encrypted = crypto.publicEncrypt(
		{
			key: publicKeyPem,
			padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
			oaepHash: "sha256",
		},
		buffer
	);
	return encrypted.toString("base64");
};

export const sendMessage = async (req, res) => {
	try {
		const { message, encryptedKey, encryptedKeySender, type } = req.body;
		const { id: receiverId } = req.params;
		const senderId = req.user._id;

		// Получаем URL загруженного файла, если есть
		let fileUrl = null;
		const messageType = type || (req.file ? (req.file.mimetype.startsWith("image/") ? "image" : "audio") : "text");
		if (req.file) {
			fileUrl = `/uploads/${messageType === "image" ? "images" : "audio"}/${req.file.filename}`;
		}

		let conversation = await Conversation.findOne({
			participants: { $all: [senderId, receiverId] },
		});

		if (!conversation) {
			conversation = await Conversation.create({
				participants: [senderId, receiverId],
			});
		}

		const newMessage = new Message({
			senderId,
			receiverId,
			message: messageType === "text" ? message : undefined,
			type: messageType,
			fileUrl: fileUrl || undefined,
			encryptedKey: messageType === "text" ? (encryptedKey || undefined) : undefined,
			encryptedKeySender: messageType === "text" ? (encryptedKeySender || undefined) : undefined,
		});

		if (newMessage) {
			conversation.messages.push(newMessage._id);
		}

		// this will run in parallel
		await Promise.all([conversation.save(), newMessage.save()]);

		// Конвертируем mongoose объект в plain object для socket.io
		const messageToEmit = newMessage.toObject ? newMessage.toObject() : JSON.parse(JSON.stringify(newMessage));
		
		// SOCKET IO FUNCTIONALITY WILL GO HERE
		const receiverSocketId = getReceiverSocketId(receiverId.toString());
		if (receiverSocketId) {
			// io.to(<socket_id>).emit() used to send events to specific client
			io.to(receiverSocketId).emit("newMessage", messageToEmit);
		}

		// Также отправляем отправителю через socket, если он онлайн
		const senderSocketId = getReceiverSocketId(senderId.toString());
		if (senderSocketId) {
			io.to(senderSocketId).emit("newMessage", messageToEmit);
		}

		res.status(201).json(newMessage);
	} catch (error) {
		console.log("Error in sendMessage:", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getMessages = async (req, res) => {
	try {
		const { id: userToChatId } = req.params;
		const senderId = req.user._id;

		const conversation = await Conversation.findOne({
			participants: { $all: [senderId, userToChatId] },
		}).populate("messages"); // NOT REFERENCE BUT ACTUAL MESSAGES

		if (!conversation) return res.status(200).json([]);

		const messages = conversation.messages;

		res.status(200).json(messages);
	} catch (error) {
		console.log("Ошибка в получении смс: ", error.message);
		res.status(500).json({ error: "Ошибка на сервере 500" });
	}
};

export const getConversations = async (req, res) => {
	try {
		const userId = req.user._id;
		const conversations = await Conversation.find({ participants: userId }).populate({
			path: "participants",
			select: "fullName username profilePic publicKey",
		}).populate({
			path: "messages",
			options: { sort: { createdAt: -1 }, limit: 1 }, // Последнее сообщение
		});

		// Форматируем для frontend: для каждого conversation вернуть другого участника
		const formattedConversations = conversations.map((conv) => {
			const otherParticipant = conv.participants.find((p) => p._id.toString() !== userId.toString());
			return {
				_id: conv._id,
				participant: otherParticipant,
				lastMessage: conv.messages[0] || null,
			};
		});

		res.status(200).json(formattedConversations);
	} catch (error) {
		console.log("Ошибка в получении разговоров: ", error.message);
		res.status(500).json({ error: "Ошибка на сервере 500" });
	}
};
