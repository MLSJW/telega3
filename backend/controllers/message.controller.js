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
		const { message, encryptedKey, encryptedKeySender } = req.body;
		const { id: receiverId } = req.params;
		const senderId = req.user._id;

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
			message,
			encryptedKey,
			encryptedKeySender,
		});

		if (newMessage) {
			conversation.messages.push(newMessage._id);
		}

		// await conversation.save();
		// await newMessage.save();

		// this will run in parallel
		await Promise.all([conversation.save(), newMessage.save()]);

		// SOCKET IO FUNCTIONALITY WILL GO HERE
		const receiverSocketId = getReceiverSocketId(receiverId);
		if (receiverSocketId) {
			// io.to(<socket_id>).emit() used to send events to specific client
			io.to(receiverSocketId).emit("newMessage", newMessage);
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
