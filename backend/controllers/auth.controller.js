import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import generateTokenAndSetCookie from "../utils/generateToken.js";
import { sendVerificationEmail } from "../utils/email.js";
import crypto from "crypto";

export const signup = async (req, res) => {
	try {
		const { fullName, username, email, password, confirmPassword, gender, publicKey } = req.body;

		if (password !== confirmPassword) {
			return res.status(400).json({ error: "Passwords don't match" });
		}

		const existingUser = await User.findOne({ $or: [{ username }, { email }] });

		if (existingUser) {
			return res.status(400).json({ error: "Username or email already exists" });
		}

		// HASH PASSWORD HERE
		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);

		const emailVerificationToken = crypto.randomBytes(32).toString('hex');

		const boyProfilePic = `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ7Bii1KzhQKysxW4Rli2tw3vsoZ_d9mEO7ew&s`;
		const girlProfilePic = `https://avatars.mds.yandex.net/i?id=7c385f5ec8c62930220726878781cb7fe23b5db9-5487972-images-thumbs&n=13`;

		const newUser = new User({
			fullName,
			username,
			email,
			password: hashedPassword,
			gender,
			profilePic: gender === "male" ? boyProfilePic : girlProfilePic,
			publicKey,
			emailVerificationToken,
		});

		if (newUser) {
			await newUser.save();

			// Send verification email
			await sendVerificationEmail(email, emailVerificationToken);

			res.status(201).json({
				message: "User created successfully. Please check your email to verify your account.",
				_id: newUser._id,
				fullName: newUser.fullName,
				username: newUser.username,
				email: newUser.email,
				profilePic: newUser.profilePic,
				publicKey: newUser.publicKey,
			});
		} else {
			res.status(400).json({ error: "Invalid user data" });
		}
	} catch (error) {
		console.log("Error in signup controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};
export const verifyEmail = async (req, res) => {
	try {
		const { token } = req.query;

		const user = await User.findOne({ emailVerificationToken: token });

		if (!user) {
			return res.status(400).json({ error: "Invalid or expired token" });
		}

		user.emailVerified = true;
		user.emailVerificationToken = undefined;
		await user.save();

		res.status(200).json({ message: "Email verified successfully" });
	} catch (error) {
		console.error("Error in verifyEmail:", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};
export const login = async (req, res) => {
	try {
		const { username, password } = req.body;
		const user = await User.findOne({ username });
		const isPasswordCorrect = await bcrypt.compare(password, user?.password || "");

		if (!user || !isPasswordCorrect) {
			return res.status(400).json({ error: "Invalid username or password" });
		}

		if (!user.emailVerified) {
			return res.status(400).json({ error: "Please verify your email before logging in" });
		}

		generateTokenAndSetCookie(user._id, res);

		res.status(200).json({
			_id: user._id,
			fullName: user.fullName,
			username: user.username,
			profilePic: user.profilePic,
			publicKey: user.publicKey,
		});
	} catch (error) {
		console.log("Ошибка входа в контроллер", error.message);
		res.status(500).json({ error: "Ошибка на сервере 500" });
	}
};

export const logout = (req, res) => {
	try {
		res.cookie("jwt", "", { maxAge: 0 });
		res.status(200).json({ message: "Вышел успешно" });
	} catch (error) {
		console.log("Ошибка в выходе из аккаунта", error.message);
		res.status(500).json({ error: "Ошибка на сервере 500" });
	}
};
