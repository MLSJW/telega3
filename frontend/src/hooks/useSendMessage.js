import { useState } from "react";
import useConversation from "../zustand/useConversation";
import toast from "react-hot-toast";
import { encryptMessage, importPublicKey, generateAESKey, encryptAES, exportAESKey } from "../utils/crypto";
import { useAuthContext } from "../context/AuthContext";

const useSendMessage = () => {
	const [loading, setLoading] = useState(false);
	const { messages, setMessages, selectedConversation } = useConversation();
	const { authUser } = useAuthContext();

	const sendMessage = async (message) => {
		setLoading(true);
		try {
			// Генерация AES ключа
			const aesKey = await generateAESKey();
			// Шифрование сообщения AES
			const encryptedData = await encryptAES(message, aesKey);
			// Экспорт AES ключа
			const aesKeyBase64 = await exportAESKey(aesKey);
			// Импорт публичного ключа получателя
			const publicKey = await importPublicKey(selectedConversation.participant.publicKey);
			// Шифрование AES ключа RSA
			const encryptedKey = await encryptMessage(aesKeyBase64, publicKey);
			// Шифрование AES ключа RSA для отправителя (чтобы можно было расшифровать после reload)
			const senderPublicKey = await importPublicKey(authUser.publicKey);
			const encryptedKeySender = await encryptMessage(aesKeyBase64, senderPublicKey);

			const res = await fetch(`/api/messages/send/${selectedConversation.participant._id}`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					message: JSON.stringify(encryptedData),
					encryptedKey,
					encryptedKeySender,
				}),
			});
			const data = await res.json();
			if (data.error) throw new Error(data.error);

			setMessages((prev) => [...prev, { ...data, message }]);
		} catch (error) {
			toast.error(error.message);
		} finally {
			setLoading(false);
		}
	};

	return { sendMessage, loading };
};
export default useSendMessage;
