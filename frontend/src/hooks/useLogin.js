import { useState } from "react";
import toast from "react-hot-toast";
import { useAuthContext } from "../context/AuthContext";
import { apiFetch } from "../utils/api";
import { generateKeyPair, exportPublicKey, exportPrivateKey } from "../utils/crypto";

const useLogin = () => {
	const [loading, setLoading] = useState(false);
	const { setAuthUser, setPrivateKey } = useAuthContext();

	const login = async (username, password) => {
		const success = handleInputErrors(username, password);
		if (!success) return;
		setLoading(true);
		try {
			const res = await apiFetch("/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ username, password }),
			});

			const data = await res.json();
			if (data.error) {
				throw new Error(data.error);
			}

			localStorage.setItem("chat-user", JSON.stringify(data));
			setAuthUser(data);

			let oldPrivateKey = localStorage.getItem("private-key");
			if (oldPrivateKey) {
				// Save old key to array
				let oldKeys = JSON.parse(localStorage.getItem("old-private-keys") || "[]");
				if (!oldKeys.includes(oldPrivateKey)) {
					oldKeys.push(oldPrivateKey);
					localStorage.setItem("old-private-keys", JSON.stringify(oldKeys));
				}
			}

			// Always generate new key pair on login to ensure consistency
			const keyPair = await generateKeyPair();
			const privateKeyBase64 = await exportPrivateKey(keyPair.privateKey);
			const publicKeyBase64 = await exportPublicKey(keyPair.publicKey);

			localStorage.setItem("private-key", privateKeyBase64);
			setPrivateKey(privateKeyBase64);

			// Update public key on server
			await apiFetch("/api/auth/update-public-key", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ publicKey: publicKeyBase64 }),
			});
		} catch (error) {
			toast.error(error.message);
		} finally {
			setLoading(false);
		}
	};

	return { loading, login };
};
export default useLogin;

function handleInputErrors(username, password) {
	if (!username || !password) {
		toast.error("Please fill in all fields");
		return false;
	}

	return true;
}
