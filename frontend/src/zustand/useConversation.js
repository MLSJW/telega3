import { create } from "zustand";

const useConversation = create((set) => ({
	selectedConversation: null,
	setSelectedConversation: (selectedConversation) => set({ selectedConversation }),
	messages: [],
	// Supports both direct array assignment and functional updates (like React setState)
	setMessages: (updater) =>
		set((state) => {
			const newMessages = typeof updater === "function" ? updater(state.messages) : updater;
			return { messages: Array.isArray(newMessages) ? newMessages.filter(msg => msg && msg._id) : [] };
		}),
}));

export default useConversation;
