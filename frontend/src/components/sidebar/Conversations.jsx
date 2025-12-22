import useGetConversations from "../../hooks/useGetConversations";
import Conversation from "./Conversation";
import { useState } from "react";
import { apiFetch } from "../../utils/api";

const Conversations = () => {
	const { loading, conversations, setConversations } = useGetConversations();

	const handleDelete = async (conversationId) => {
		try {
			const res = await apiFetch(`/api/messages/conversations/${conversationId}`, { method: 'DELETE' });
			const data = await res.json();
			if (data.error) throw new Error(data.error);
			setConversations((prev) => prev.filter((c) => c._id !== conversationId));
		} catch (err) {
			console.error('Delete conversation error', err);
		}
	};
	const [filter, setFilter] = useState("");

	const filtered = Array.isArray(conversations)
		? conversations.filter(c => {
			const name = c.participant?.fullName || "";
			const q = filter.trim().toLowerCase();
			if (!q) return true;
			return name.toLowerCase().includes(q);
		})
		: [];

	return (
		<div className='py-2 flex flex-col overflow-auto'>
			<div className='px-2 pb-2'>
				<input
					className='input input-sm w-full input-bordered'
					placeholder='Поиск по чатам'
					value={filter}
					onChange={(e) => setFilter(e.target.value)}
				/>
			</div>

			{filtered.filter(conversation => conversation && conversation._id).map((conversation, idx) => (
				<Conversation
					key={conversation._id}
					conversation={conversation}
					lastIdx={idx === filtered.length - 1}
					onDelete={() => handleDelete(conversation._id)}
				/>
			))}

			{loading ? <span className='loading loading-spinner mx-auto'></span> : null}
		</div>
	);
};
export default Conversations;

// STARTER CODE SNIPPET
// import Conversation from "./Conversation";

// const Conversations = () => {
// 	return (
// 		<div className='py-2 flex flex-col overflow-auto'>
// 			<Conversation />
// 			<Conversation />
// 			<Conversation />
// 			<Conversation />
// 			<Conversation />
// 			<Conversation />
// 		</div>
// 	);
// };
// export default Conversations;
