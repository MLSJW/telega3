import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
	{
		senderId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		receiverId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		message: {
			type: String,
			required: function() {
				return this.type === "text";
			},
		},
		type: {
			type: String,
			enum: ["text", "audio", "image"],
			default: "text",
		},
		fileUrl: {
			type: String,
			required: function() {
				return this.type === "audio" || this.type === "image";
			},
		},
		encryptedKey: {
			type: String,
			required: false, 
		},

		encryptedKeySender: {
			type: String,
			required: false,
		},

		readBy: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],

	},
	{ timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;
