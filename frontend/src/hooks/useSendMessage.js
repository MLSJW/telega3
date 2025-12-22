import { useState } from "react";
import useConversation from "../zustand/useConversation";
import toast from "react-hot-toast";
import { encryptMessage, importPublicKey, generateAESKey, encryptAES, exportAESKey } from "../utils/crypto";
import { useAuthContext } from "../context/AuthContext";
import { apiFetch } from "../utils/api";

const useSendMessage = () => {
	const [loading, setLoading] = useState(false);
	const { messages, setMessages, selectedConversation } = useConversation();
	const { authUser } = useAuthContext();

	const sendMessage = async (message) => {
		setLoading(true);
		try {
			if (!selectedConversation?.participant?._id) throw new Error("Чат не выбран");
			if (!selectedConversation?.participant?.publicKey) throw new Error("У собеседника нет publicKey (нужна повторная регистрация/обновление ключей)");
			if (!authUser?.publicKey) throw new Error("У вас нет publicKey (перелогиньтесь/перерегистрируйтесь)");

			const aesKey = await generateAESKey();
			const encryptedData = await encryptAES(message, aesKey);
			const aesKeyBase64 = await exportAESKey(aesKey);
			const publicKey = await importPublicKey(selectedConversation.participant.publicKey);
			const encryptedKey = await encryptMessage(aesKeyBase64, publicKey);
			const senderPublicKey = await importPublicKey(authUser.publicKey);
			const encryptedKeySender = await encryptMessage(aesKeyBase64, senderPublicKey);

			const res = await apiFetch(`/api/messages/send/${selectedConversation.participant._id}`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					message: JSON.stringify(encryptedData),
					encryptedKey,
					encryptedKeySender,
					type: "text",
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

	const sendAudioMessage = async (audioBlob) => {
		setLoading(true);
		try {
			if (!selectedConversation?.participant?._id) throw new Error("Чат не выбран");

			const formData = new FormData();
			formData.append("file", audioBlob, "audio.webm");
			formData.append("type", "audio");

			const res = await fetch(`/api/messages/send/${selectedConversation.participant._id}`, {
				method: "POST",
				credentials: "include",
				body: formData,
			});
			const data = await res.json();
			if (data.error) throw new Error(data.error);

			toast.success("Голосовое сообщение отправлено");
		} catch (error) {
			toast.error(error.message);
		} finally {
			setLoading(false);
		}
	};

	const sendImageMessage = async (imageFile) => {
		setLoading(true);
		try {
			if (!selectedConversation?.participant?._id) throw new Error("Чат не выбран");

			const formData = new FormData();
			formData.append("file", imageFile);
			formData.append("type", "image");

			const res = await fetch(`/api/messages/send/${selectedConversation.participant._id}`, {
				method: "POST",
				credentials: "include",
				body: formData,
			});
			const data = await res.json();
			if (data.error) throw new Error(data.error);

			toast.success("Изображение отправлено");
		} catch (error) {
			toast.error(error.message);
		} finally {
			setLoading(false);
		}
	};

	return { sendMessage, sendAudioMessage, sendImageMessage, loading };
};
export default useSendMessage;
