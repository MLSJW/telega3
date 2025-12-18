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
			let message;
			if (privateKey) {
				try {
					const privateKeyObj = await importPrivateKey(privateKey);
					// if I am sender -> use encryptedKeySender; else use encryptedKey
					const keyToUse = newMessage.senderId === authUser._id ? newMessage.encryptedKeySender : newMessage.encryptedKey;
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
			newMessage.message = message;
			newMessage.shouldShake = true;
			const sound = new Audio(notificationSound);
			sound.play();
			setMessages((prev) => [...prev, newMessage]);
		});

		return () => socket?.off("newMessage");
	}, [socket, setMessages, privateKey, authUser]);
};
export default useListenMessages;
