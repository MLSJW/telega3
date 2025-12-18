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
				const res = await fetch(`/api/messages/${selectedConversation.participant._id}`);
				const data = await res.json();
				if (data.error) throw new Error(data.error);

				const privateKeyObj = await importPrivateKey(privateKey);
				const decryptedMessages = await Promise.all(data.map(async (msg) => {
					let message;
					try {
						// if I am sender -> use encryptedKeySender; else use encryptedKey
						const keyToUse = msg.senderId === authUser._id ? msg.encryptedKeySender : msg.encryptedKey;
						const decryptedKey = await decryptMessage(keyToUse, privateKeyObj);
						const aesKey = await importAESKey(decryptedKey);
						const encryptedData = JSON.parse(msg.message);
						message = await decryptAES(encryptedData, aesKey);
					} catch (error) {
						console.error("Decrypt error:", error);
						message = "Error decrypting message";
					}
					return { ...msg, message };
				}));
				setMessages(decryptedMessages);
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
