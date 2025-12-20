import { useSocketContext } from "../../context/SocketContext";
import { useAuthContext } from "../../context/AuthContext";
import useConversation from "../../zustand/useConversation";
import { useState, useEffect } from "react";

const Conversation = ({ conversation, lastIdx, onDelete }) => {
	const { selectedConversation, setSelectedConversation } = useConversation();
	const [showDelete, setShowDelete] = useState(false);
	const [preview, setPreview] = useState('');

	const participant = conversation.participant;
	const isSelected = selectedConversation?.participant?._id === conversation.participant._id;
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
						<img src={participant.profilePic} alt='user avatar' />
					</div>
				</div>

				<div className='flex flex-col flex-1'>
					<div className='flex gap-3 justify-between'>
						<p className='font-bold text-gray-200'>{participant.fullName}</p>
						<div className='flex items-center gap-2'>
							{conversation.unreadCount > 0 && (
								<span className='badge badge-error'>{conversation.unreadCount}</span>
							)}
						</div>
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

// STARTER CODE SNIPPET
// const Conversation = () => {
// 	return (
// 		<>
// 			<div className='flex gap-2 items-center hover:bg-sky-500 rounded p-2 py-1 cursor-pointer'>
// 				<div className='avatar online'>
// 					<div className='w-12 rounded-full'>
// 						<img
// 							src='https://cdn0.iconfinder.com/data/icons/communication-line-10/24/account_profile_user_contact_person_avatar_placeholder-512.png'
// 							alt='user avatar'
// 						/>
// 					</div>
// 				</div>

// 				<div className='flex flex-col flex-1'>
// 					<div className='flex gap-3 justify-between'>
// 						<p className='font-bold text-gray-200'>John Doe</p>
// 						<span className='text-xl'>🎃</span>
// 					</div>
// 				</div>
// 			</div>

// 			<div className='divider my-0 py-0 h-1' />
// 		</>
// 	);
// };
// export default Conversation;
