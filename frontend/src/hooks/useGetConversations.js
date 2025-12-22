import { useEffect, useState } from "react";
import { useSocketContext } from "../context/SocketContext";
import { useAuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";
import { apiFetch } from "../utils/api";

const useGetConversations = () => {
	const [loading, setLoading] = useState(false);
	const [conversations, setConversations] = useState([]);
	const { socket } = useSocketContext();
	const { authUser } = useAuthContext();

	useEffect(() => {
		const getConversations = async () => {
			setLoading(true);
			try {
				const res = await apiFetch("/api/messages/conversations", {
					credentials: "include",
				});
				const data = await res.json();
				if (data.error) {
					throw new Error(data.error);
				}
				if (!Array.isArray(data)) throw new Error("Invalid conversations payload (expected array)");
				setConversations(data);
			} catch (error) {
				toast.error(error.message);
			} finally {
				setLoading(false);
			}
		};

		getConversations();
	}, []);

	useEffect(() => {
		if (!socket || !authUser) return;

		const onNewConversation = (conversation) => {
			setConversations((prev) => {
				if (prev.some((c) => c._id === conversation._id)) return prev;
				const participant = conversation.participants.find(p => p._id !== authUser._id);
				return [{ ...conversation, participant }, ...prev];
			});
		};

		const onConversationDeleted = ({ conversationId }) => {
			setConversations((prev) => prev.filter((c) => c._id !== conversationId));
		};

		const onMessagesRead = ({ conversationId, userId }) => {
			if (userId === authUser._id) {
				setConversations((prev) => prev.map((c) => (c._id === conversationId ? { ...c, unreadCount: 0 } : c)));
			}
		};

		const onNewMessage = (newMessage) => {
			setConversations((prev) => {
				const updated = prev.map((c) => {
					const isParticipant = c.participant._id === newMessage.senderId || c.participant._id === newMessage.receiverId;
					if (isParticipant) {
						const newUnreadCount = newMessage.senderId !== authUser._id ? c.unreadCount + 1 : c.unreadCount;
						return { ...c, lastMessage: newMessage, unreadCount: newUnreadCount };
					}
					return c;
				});
				updated.sort((a, b) => {
					const ta = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
					const tb = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
					return tb - ta;
				});
				return updated;
			});
		};

		socket.on("newConversation", onNewConversation);
		socket.on("conversationDeleted", onConversationDeleted);
		socket.on("messagesRead", onMessagesRead);
		socket.on("newMessage", onNewMessage);
		return () => {
			socket.off("newConversation", onNewConversation);
			socket.off("conversationDeleted", onConversationDeleted);
			socket.off("messagesRead", onMessagesRead);
			socket.off("newMessage", onNewMessage);
		};
	}, [socket, authUser]);

	return { loading, conversations, setConversations };
};
export default useGetConversations;
