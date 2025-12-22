import { createContext, useContext, useState } from "react";

export const AuthContext = createContext();


export const useAuthContext = () => {
	return useContext(AuthContext);
};

export const AuthContextProvider = ({ children }) => {
	let initialUser = null;
	try {
		const raw = localStorage.getItem("chat-user");
		const parsed = raw ? JSON.parse(raw) : null;
		if (parsed?._id && parsed?.publicKey) initialUser = parsed;
		else if (parsed) {
			localStorage.removeItem("chat-user");
		}
	} catch {
		localStorage.removeItem("chat-user");
	}

	const [authUser, setAuthUser] = useState(initialUser);
	const [privateKey, setPrivateKey] = useState(localStorage.getItem("private-key") || null);

	return <AuthContext.Provider value={{ authUser, setAuthUser, privateKey, setPrivateKey }}>{children}</AuthContext.Provider>;
};
