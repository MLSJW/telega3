import { useEffect } from "react";

import { useSocketContext } from "../context/SocketContext";
import useConversation from "../zustand/useConversation";

import notificationSound from "../assets/sounds/notification.mp3";
import { decryptMessage, importPrivateKey, importAESKey, decryptAES } from "../utils/crypto";
import { useAuthContext } from "../context/AuthContext";

const useListenMessages = () => {
	const { socket } = useSocketContext();
	const { messages, setMessages } = useConversation();
	const { privateKey, authUser } = useAuthContext();

	useEffect(() => {
		socket?.on("newMessage", async (newMessage) => {
			// Determine message type (default "text")
			const msgType = newMessage.type || "text";
			
			// Audio and images are not encrypted, add as is
			if (msgType === "audio" || msgType === "image") {
				newMessage.type = msgType;
				newMessage.shouldShake = true;
				const sound = new Audio(notificationSound);
				try {
					await sound.play();
				} catch {
					// ignore autoplay policy errors
				}
				setMessages((prev) => {
					if (prev.some((m) => m._id === newMessage._id)) return prev;
					return [...prev, newMessage];
				});
				return;
			}

			// Text messages require decryption
			let message;
			if (privateKey) {
				try {
					const privateKeyObj = await importPrivateKey(privateKey);
					// if I am sender -> use encryptedKeySender; else use encryptedKey
					const isSender = newMessage.senderId === authUser._id;
					const keyToUse = isSender ? newMessage.encryptedKeySender : newMessage.encryptedKey;
					if (!keyToUse) {
						message = isSender
							? "[Unable to decrypt: message sent before update]"
							: "[Unable to decrypt: key missing]";
						newMessage.message = message;
						newMessage.shouldShake = true;
						setMessages((prev) => {
							if (prev.some((m) => m._id === newMessage._id)) return prev;
							return [...prev, newMessage];
						});
						return;
					}
					const decryptedKey = await decryptMessage(keyToUse, privateKeyObj);
					const aesKey = await importAESKey(decryptedKey);
					const encryptedData = JSON.parse(newMessage.message);
					message = await decryptAES(encryptedData, aesKey);
				} catch (error) {
					console.error("Decrypt error in realtime:", error);
					message = "Error decrypting message";
				}
			} else {
				message = "Missing private key";
			}
			newMessage.type = msgType;
			newMessage.message = message;
			newMessage.shouldShake = true;
			const sound = new Audio(notificationSound);
			try {
				await sound.play();
			} catch {
				// ignore autoplay policy errors
			}
			setMessages((prev) => {
				if (prev.some((m) => m._id === newMessage._id)) return prev;
				return [...prev, newMessage];
			});
		});

		socket?.on("messagesRead", ({ conversationId, userId }) => {
			setMessages((prev) =>
				prev.map((msg) =>
					msg.receiverId === userId ? { ...msg, readBy: [...(msg.readBy || []), userId] } : msg
				)
			);
		});

		return () => {
			socket?.off("newMessage");
			socket?.off("messagesRead");
		};
	}, [socket, setMessages, privateKey, authUser]);
};
export default useListenMessages;
