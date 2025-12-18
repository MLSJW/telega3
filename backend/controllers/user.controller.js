import User from "../models/user.model.js";

export const getUsersForSidebar = async (req, res) => {
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
};
