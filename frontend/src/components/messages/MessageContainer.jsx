import { useEffect } from "react";
import useConversation from "../../zustand/useConversation";
import MessageInput from "./MessageInput";
import Messages from "./Messages";
import { TiMessages } from "react-icons/ti";
import { useAuthContext } from "../../context/AuthContext";
import { useSocketContext } from "../../context/SocketContext";
import { apiFetch } from "../../utils/api";

const MessageContainer = () => {
	const { selectedConversation, setSelectedConversation } = useConversation();
	const { onlineUsers } = useSocketContext();

	useEffect(() => {
		return () => setSelectedConversation(null);
	}, [setSelectedConversation]);

	useEffect(() => {
		if (selectedConversation?._id) {
			apiFetch(`/api/messages/conversations/${selectedConversation._id}/read`, {
				method: 'POST',
			}).catch(err => console.error('Error marking as read:', err));
		}
	}, [selectedConversation?._id]);

	return (
		<div className='md:min-w-[450px] flex flex-col flex-1'>
			{!selectedConversation ? (
				<NoChatSelected />
			) : (
				<>
					{/* Header */}
					<div className='bg-slate-500 px-4 py-2 mb-2'>
						<span className='label-text'></span>{" "}
						<span className='text-gray-900 font-bold'>{selectedConversation.participant.fullName}</span>
						<span className={`text-sm ml-2 ${onlineUsers.includes(selectedConversation.participant._id) ? 'text-green-400' : 'text-gray-400'}`}>
							{onlineUsers.includes(selectedConversation.participant._id) ? 'В сети' : 'Не в сети'}
						</span>
					</div>
					<Messages />
					<MessageInput />
				</>
			)}
		</div>
	);
};
export default MessageContainer;

const NoChatSelected = () => {
	const { authUser } = useAuthContext();
	return (
		<div className='flex items-center justify-center w-full h-full'>
			<div className='px-4 text-center sm:text-lg md:text-xl text-gray-200 font-semibold flex flex-col items-center gap-2'>
				<p>Привет, {authUser?.fullName ?? "друг"}!</p>
				<p>Выберите, кому хотели бы написать</p>
				<TiMessages className='text-3xl md:text-6xl text-center' />
			</div>
		</div>
	);
};
