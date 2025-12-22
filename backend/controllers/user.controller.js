import User from "../models/user.model.js";

export async function getUsersForSidebar(req, res) {
	try {
		const loggedInUserId = req.user._id;
		const { search } = req.query;
		let query = { _id: { $ne: loggedInUserId } };
		if (search) {
			query.$or = [
				{ username: { $regex: search, $options: 'i' } },
				{ fullName: { $regex: search, $options: 'i' } }
			];
		}
		const filteredUsers = await User.find(query).select("-password");
		res.status(200).json(filteredUsers);
	} catch (error) {
		console.error("Ошибка в получении слайдбара юзеров: ", error.message);
		res.status(500).json({ error: "Ошибка на сервере 500" });
	}
}


export async function deleteMyAccount(req, res) {
	try {
		const userId = req.user._id;
		await User.findByIdAndDelete(userId);
		res.clearCookie("jwt");
		res.json({ success: true });
	} catch (error) {
		console.error("Ошибка при удалении аккаунта:", error.message);
		res.status(500).json({ error: "Ошибка на сервере" });
	}
};


export async function updateMyProfile(req, res) {
	try {
		const userId = req.user._id;
		const { fullName, username, password } = req.body;
		const profilePic = req.file ? `/uploads/images/${req.file.filename}` : undefined;
		console.log("Обновление профиля для пользователя:", userId);
		console.log("req.body:", req.body);
		console.log("req.file:", req.file);
		console.log("profilePic:", profilePic);
		const update = {};
		if (fullName) update.fullName = fullName;
		if (username) update.username = username;
		if (password) update.password = password; 
		if (profilePic) update.profilePic = profilePic;
		console.log("update object:", update);
		const updated = await User.findByIdAndUpdate(userId, update, { new: true });
		console.log("updated user:", updated);
		res.json(updated);
	} catch (error) {
		console.error("Ошибка при обновлении профиля:", error.message);
		res.status(500).json({ error: "Ошибка на сервере" });
	}
};
