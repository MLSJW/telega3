import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import generateTokenAndSetCookie from "../utils/generateToken.js";
import { sendVerificationEmail, sendResetPasswordEmail } from "../utils/email.js";
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

		const boyProfilePic = `/boyPicrute.jpg`;
		const girlProfilePic = `/girlPicture.webp`;

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
		const user = await User.findOne({ $or: [{ username }, { email: username }] });
		const isPasswordCorrect = await bcrypt.compare(password, user?.password || "");

		if (!user || !isPasswordCorrect) {
			return res.status(400).json({ error: "Invalid username/email or password" });
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

export const forgotPassword = async (req, res) => {
	try {
		const { email } = req.body;
		console.log("Forgot password request for email:", email);
		const user = await User.findOne({ email });
		if (!user) {
			console.log("User not found for email:", email);
			return res.status(400).json({ error: "Пользователь с таким email не найден" });
		}
		console.log("User found:", user.email);
		const resetToken = crypto.randomBytes(32).toString('hex');
		user.resetPasswordToken = resetToken;
		user.resetPasswordExpires = Date.now() + 3600000;
		await user.save();
		console.log("Token saved, sending email...");
		await sendResetPasswordEmail(email, resetToken);
		console.log("Email sent successfully");
		res.status(200).json({ message: "Ссылка для сброса пароля отправлена на email" });
	} catch (error) {
		console.log("Ошибка в forgotPassword:", error.message);
		res.status(500).json({ error: "Ошибка на сервере" });
	}
};

export const resetPassword = async (req, res) => {
	try {
		const { token, newPassword } = req.body;
		const user = await User.findOne({
			resetPasswordToken: token,
			resetPasswordExpires: { $gt: Date.now() }
		});

		if (!user) {
			return res.status(400).json({ error: "Неверный или истекший токен" });
		}

		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(newPassword, salt);

		user.password = hashedPassword;
		user.resetPasswordToken = undefined;
		user.resetPasswordExpires = undefined;
		await user.save();

		res.status(200).json({ message: "Пароль успешно сброшен" });
	} catch (error) {
		console.log("Ошибка в resetPassword:", error.message);
		res.status(500).json({ error: "Ошибка на сервере" });
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

export const updatePublicKey = async (req, res) => {
	try {
		const { publicKey } = req.body;
		const user = await User.findById(req.user._id);
		if (!user) return res.status(404).json({ error: "Пользователь не найден" });

		user.publicKey = publicKey;
		await user.save();

		res.status(200).json({ message: "Public key updated" });
	} catch (error) {
		console.log("Error in updatePublicKey:", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};
