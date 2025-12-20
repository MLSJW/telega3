import { useEffect, useState } from "react";
import useConversation from "../zustand/useConversation";
import toast from "react-hot-toast";
import { decryptMessage, importPrivateKey, importAESKey, decryptAES } from "../utils/crypto";
import { useAuthContext } from "../context/AuthContext";

const useGetMessages = () => {
	const [loading, setLoading] = useState(false);
	const { messages, setMessages, selectedConversation } = useConversation();
	const { privateKey, authUser } = useAuthContext();

	useEffect(() => {
		const getMessages = async () => {
			setLoading(true);
			try {
				const res = await fetch(`/api/messages/${selectedConversation.participant._id}`, {
					credentials: "include",
				});
				const data = await res.json();
				if (data.error) throw new Error(data.error);
				if (!Array.isArray(data.messages)) throw new Error("Invalid messages payload (expected array)");

				const decryptedMessages = await Promise.all(data.messages.map(async (msg) => {
					// Определяем тип сообщения (по умолчанию "text")
					const msgType = msg.type || "text";
					
					// Аудио и изображения не шифруются, просто возвращаем как есть
					if (msgType === "audio" || msgType === "image") {
						return { ...msg, type: msgType };
					}

					// Текстовые сообщения требуют расшифровки
					if (!privateKey) {
						return { ...msg, type: msgType, message: "Missing private key" };
					}

					const privateKeyObj = await importPrivateKey(privateKey);
					let message;
					try {
						// if I am sender -> use encryptedKeySender; else use encryptedKey
						const isSender = msg.senderId === authUser._id;
						const keyToUse = isSender ? msg.encryptedKeySender : msg.encryptedKey;
						if (!keyToUse) {
							message = isSender
								? "[Не удаётся расшифровать: сообщение отправлено до обновления]"
								: "[Не удаётся расшифровать: отсутствует ключ]";
							return { ...msg, type: msgType, message };
						}
						const decryptedKey = await decryptMessage(keyToUse, privateKeyObj);
						const aesKey = await importAESKey(decryptedKey);
						const encryptedData = JSON.parse(msg.message);
						message = await decryptAES(encryptedData, aesKey);
					} catch (error) {
						console.error("Decrypt error:", error);
						message = "Error decrypting message";
					}
					return { ...msg, type: msgType, message };
				}));
				setMessages(decryptedMessages);

				// mark messages as read on server for this conversation
				if (data.conversationId) {
					try {
						await fetch(`/api/messages/conversations/${data.conversationId}/read`, {
							method: "POST",
							credentials: "include",
						});
					} catch (err) {
						console.error("Error marking conversation read:", err);
					}
				}
			} catch (error) {
				toast.error(error.message);
			} finally {
				setLoading(false);
			}
		};

		if (selectedConversation?.participant?._id && privateKey && authUser) getMessages();
	}, [selectedConversation?.participant?._id, setMessages, privateKey, authUser]);

	return { messages, loading };
};
export default useGetMessages;
