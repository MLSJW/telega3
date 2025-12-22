import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";
import crypto from "crypto";
import User from "../models/user.model.js";

const ALGORITHM = "rsa";
const KEY_FORMAT = "pem";


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

		let fileUrl = null;
		const messageType = type || (req.file ? (req.file.mimetype.startsWith("image/") ? "image" : "audio") : "text");
		if (req.file) {
			fileUrl = `/uploads/${messageType === "image" ? "images" : "audio"}/${req.file.filename}`;
		}

		let conversation = await Conversation.findOne({
			participants: { $all: [senderId, receiverId] },
		});

		let isNewConversation = false;
		if (!conversation) {
			conversation = await Conversation.create({
				participants: [senderId, receiverId],
			});
			isNewConversation = true;
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

	
		await Promise.all([conversation.save(), newMessage.save()]);


		const messageToEmit = newMessage.toObject ? newMessage.toObject() : JSON.parse(JSON.stringify(newMessage));
		
	
		const receiverSocketId = getReceiverSocketId(receiverId.toString());
		if (receiverSocketId) {
		
			io.to(receiverSocketId).emit("newMessage", messageToEmit);
		}

	
		const senderSocketId = getReceiverSocketId(senderId.toString());
		if (senderSocketId) {
			io.to(senderSocketId).emit("newMessage", messageToEmit);
		}

		
		if (isNewConversation) {
			try {
				const otherParticipant = await User.findById(receiverId).select("fullName username profilePic publicKey");
				const formattedConversation = {
					_id: conversation._id,
					participant: otherParticipant,
					lastMessage: messageToEmit,
				};
				if (receiverSocketId) io.to(receiverSocketId).emit("newConversation", formattedConversation);
				if (senderSocketId) io.to(senderSocketId).emit("newConversation", formattedConversation);
			} catch (err) {
				console.error("Error emitting newConversation:", err.message);
			}
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
		}).populate("messages"); 

		if (!conversation) return res.status(200).json({ messages: [], conversationId: null });

		const messages = conversation.messages;

		res.status(200).json({ messages, conversationId: conversation._id });
	} catch (error) {
		console.log("Ошибка в получении смс: ", error.message);
		res.status(500).json({ error: "Ошибка на сервере 500" });
	}
};

export const markConversationRead = async (req, res) => {
	try {
		const { id: conversationId } = req.params;
		const userId = req.user._id;

		const conversation = await Conversation.findById(conversationId);
		if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
		if (!conversation.participants.map(p => p.toString()).includes(userId.toString())) {
			return res.status(403).json({ error: 'Not a participant' });
		}

		const update = await Message.updateMany(
			{ _id: { $in: conversation.messages }, receiverId: userId, readBy: { $nin: [userId] } },
			{ $push: { readBy: userId } }
		);

		
		const participantIds = conversation.participants.map(p => p.toString());
		participantIds.forEach(pid => {
			const sockId = getReceiverSocketId(pid);
			if (sockId) io.to(sockId).emit('messagesRead', { conversationId, userId: userId.toString() });
		});

		res.status(200).json({ modifiedCount: update.modifiedCount || update.nModified || 0 });
	} catch (error) {
		console.error('Error in markConversationRead:', error.message);
		res.status(500).json({ error: 'Internal server error' });
	}
};

export const deleteConversation = async (req, res) => {
	try {
		const { id: conversationId } = req.params;
		const userId = req.user._id;

		const conversation = await Conversation.findById(conversationId);
		if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
		if (!conversation.participants.map(p => p.toString()).includes(userId.toString())) {
			return res.status(403).json({ error: 'Not a participant' });
		}

		
		await Message.deleteMany({ _id: { $in: conversation.messages } });
		await conversation.remove();

		
		const otherParticipantId = conversation.participants.find(p => p.toString() !== userId.toString());
		const otherSocketId = getReceiverSocketId(otherParticipantId.toString());
		if (otherSocketId) {
			io.to(otherSocketId).emit('conversationDeleted', { conversationId });
		}

		res.status(200).json({ success: true });
	} catch (error) {
		console.error('Error in deleteConversation:', error.message);
		res.status(500).json({ error: 'Internal server error' });
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
			options: { sort: { createdAt: -1 }, limit: 1 }, 
		});

		
		const formattedConversations = await Promise.all(conversations.map(async (conv) => {
			const otherParticipant = conv.participants.find((p) => p._id.toString() !== userId.toString());
			
			const unreadCount = await Message.countDocuments({ _id: { $in: conv.messages }, receiverId: userId, readBy: { $nin: [userId] } });
			return {
				_id: conv._id,
				participant: otherParticipant,
				lastMessage: conv.messages[0] || null,
				unreadCount,
			};
		}));

		
		formattedConversations.sort((a, b) => {
			const ta = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
			const tb = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
			return tb - ta;
		});

		res.status(200).json(formattedConversations);
	} catch (error) {
		console.log("Ошибка в получении разговоров: ", error.message);
		res.status(500).json({ error: "Ошибка на сервере 500" });
	}
};
