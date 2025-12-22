import { useState, useRef } from "react";
import { BsSend, BsImage, BsEmojiSmile } from "react-icons/bs";
import useSendMessage from "../../hooks/useSendMessage";
import AudioRecorder from "./AudioRecorder";

const MessageInput = () => {
	const [message, setMessage] = useState("");
	const [audioBlob, setAudioBlob] = useState(null);
	const [selectedImage, setSelectedImage] = useState(null);
	const [showEmoji, setShowEmoji] = useState(false);
	const fileInputRef = useRef(null);
	const { loading, sendMessage, sendAudioMessage, sendImageMessage } = useSendMessage();

	const emojis = [];

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!message && !audioBlob && !selectedImage) return;
		
		if (audioBlob) {
			await sendAudioMessage(audioBlob);
			setAudioBlob(null);
		} else if (selectedImage) {
			await sendImageMessage(selectedImage);
			setSelectedImage(null);
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
		} else {
			await sendMessage(message);
			setMessage("");
		}
	};

	const handleImageSelect = (e) => {
		const file = e.target.files[0];
		if (file && file.type.startsWith("image/")) {
			setSelectedImage(file);
			setAudioBlob(null); 
		}
	};

	const handleRecordingComplete = (blob) => {
		setAudioBlob(blob);
		setSelectedImage(null); 
	};

	const handleCancelRecording = () => {
		setAudioBlob(null);
	};

	return (
		<form className='px-4 my-3' onSubmit={handleSubmit}>
			{selectedImage && (
				<div className="mb-2 relative inline-block">
					<img
						src={URL.createObjectURL(selectedImage)}
						alt="Preview"
						className="max-h-32 rounded-lg"
					/>
					<button
						type="button"
						onClick={() => {
							setSelectedImage(null);
							if (fileInputRef.current) fileInputRef.current.value = "";
						}}
						className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
					>
						×
					</button>
				</div>
			)}
			
			<div className='w-full relative flex items-center gap-2'>
				<input
					type='file'
					ref={fileInputRef}
					accept='image/*'
					onChange={handleImageSelect}
					className='hidden'
				/>
				<button
					type='button'
					onClick={() => fileInputRef.current?.click()}
					className='p-2 text-blue-500 hover:bg-gray-600 rounded-full transition-colors'
					title='Отправить изображение'
				>
					<BsImage className="w-5 h-5" />
				</button>
				
				<button
					type='button'
					onClick={() => setShowEmoji(!showEmoji)}
					className='p-2 text-blue-500 hover:bg-gray-600 rounded-full transition-colors'
					title='Добавить эмодзи'
				>
					<BsEmojiSmile className="w-5 h-5" />
				</button>
				
				{!audioBlob ? (
					<AudioRecorder
						onRecordingComplete={handleRecordingComplete}
						onCancel={handleCancelRecording}
					/>
				) : (
					<div className="flex items-center gap-2 px-2 py-1 bg-blue-500/20 rounded">
						<span className="text-sm text-white">Аудио готово</span>
						<button
							type="button"
							onClick={() => setAudioBlob(null)}
							className="text-xs text-red-300 hover:text-red-100"
						>
							Отмена
						</button>
					</div>
				)}

				<input
					type='text'
					className='border text-sm rounded-lg block flex-1 p-2.5 bg-gray-700 border-gray-600 text-white'
					placeholder={audioBlob ? 'Голосовое сообщение готово' : selectedImage ? 'Изображение выбрано' : 'Написать сообщение'}
					value={message}
					onChange={(e) => setMessage(e.target.value)}
					disabled={!!audioBlob || !!selectedImage}
				/>
				<button 
					type='submit' 
					className='p-2 text-blue-500 hover:bg-gray-600 rounded-full transition-colors'
					disabled={loading || (!message && !audioBlob && !selectedImage)}
				>
					{loading ? <div className='loading loading-spinner loading-sm'></div> : <BsSend className="w-5 h-5" />}
				</button>
			</div>
			
			{showEmoji && (
				<div className='absolute bottom-full mb-2 bg-gray-700 p-2 rounded flex flex-wrap gap-1 max-w-xs'>
					{emojis.map(emj => (
						<button 
							key={emj} 
							onClick={() => { setMessage(prev => prev + emj); setShowEmoji(false); }} 
							className='text-2xl p-1 hover:bg-gray-600 rounded'
						>
							{emj}
						</button>
					))}
				</div>
			)}
		</form>
	);
};
export default MessageInput;

// STARTER CODE SNIPPET
// import { BsSend } from "react-icons/bs";

// const MessageInput = () => {
// 	return (
// 		<form className='px-4 my-3'>
// 			<div className='w-full'>
// 				<input
// 					type='text'
// 					className='border text-sm rounded-lg block w-full p-2.5  bg-gray-700 border-gray-600 text-white'
// 					placeholder='Send a message'
// 				/>
// 				<button type='submit' className='absolute inset-y-0 end-0 flex items-center pe-3'>
// 					<BsSend />
// 				</button>
// 			</div>
// 		</form>
// 	);
// };
// export default MessageInput;
