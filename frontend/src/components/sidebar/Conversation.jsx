import { useSocketContext } from "../../context/SocketContext";
import { useAuthContext } from "../../context/AuthContext";
import useConversation from "../../zustand/useConversation";
import { useState, useEffect } from "react";

const Conversation = ({ conversation, lastIdx, onDelete }) => {
	const { selectedConversation, setSelectedConversation } = useConversation();
	const [showDelete, setShowDelete] = useState(false);
	const [preview, setPreview] = useState('');

	const participant = conversation.participant;
	if (!participant) return null; // Prevent errors if participant is undefined

	const isSelected = selectedConversation?.participant?._id === participant._id;
	const { onlineUsers } = useSocketContext();
	const isOnline = onlineUsers.includes(participant._id);

	const lastMsg = conversation.lastMessage;
	const { authUser } = useAuthContext();
	const isLastMsgSentByMe = lastMsg && lastMsg.senderId === authUser?._id;
	const isLastMsgRead = lastMsg && Array.isArray(lastMsg.readBy) && lastMsg.readBy.includes(conversation.participant._id);

	useEffect(() => {
		if (lastMsg) {
			setPreview(lastMsg.type === 'audio' ? 'Голосовое' : lastMsg.type === 'image' ? 'Изображение' : 'Сообщение');
		}
	}, [lastMsg]);

	return (
		<>
			<div
				className={`flex gap-2 items-center hover:bg-sky-500 rounded p-2 py-1 cursor-pointer
				${isSelected ? "bg-sky-500" : ""}
			`}
				onClick={() => {
					setSelectedConversation({ ...conversation, participant });
					setShowDelete(!showDelete);
				}}
			>
				<div className={`avatar ${isOnline ? "online" : ""}`}>
					<div className='w-12 rounded-full'>
						<img src={participant.profilePic} alt='user avatar' onError={(e) => { e.target.src = '/logo.png'; }} />
					</div>
				</div>

				<div className='flex flex-col flex-1'>
					<div className='flex gap-3 justify-between'>
						<p className='font-bold text-gray-200'>{participant.fullName}</p>
					</div>
					{lastMsg && (
						<p className='text-sm text-gray-400 truncate'>
							{preview}
						</p>
					)}
					{isLastMsgSentByMe && (
						<div className='text-xs text-green-300'>{isLastMsgRead ? 'Прочитано' : 'Отправлено'}</div>
					)}
				</div>

				{showDelete && (
					<div className='flex items-center gap-2'>
						<button className='btn btn-ghost btn-sm text-red-400' onClick={(e) => { e.stopPropagation(); onDelete?.(); }}>⋮</button>
					</div>
				)}
			</div>

			{!lastIdx && <div className='divider my-0 py-0 h-1' />}
		</>
	);
};
export default Conversation;
