import { useState, useRef, useEffect } from "react";
import { BsMic, BsStopCircle } from "react-icons/bs";

const AudioRecorder = ({ onRecordingComplete, onCancel }) => {
	const [isRecording, setIsRecording] = useState(false);
	const [recordingTime, setRecordingTime] = useState(0);
	const mediaRecorderRef = useRef(null);
	const audioChunksRef = useRef([]);
	const timerRef = useRef(null);

	useEffect(() => {
		return () => {
			if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
				mediaRecorderRef.current.stop();
			}
			if (timerRef.current) {
				clearInterval(timerRef.current);
			}
		};
	}, []);

	const startRecording = async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			const mediaRecorder = new MediaRecorder(stream);
			mediaRecorderRef.current = mediaRecorder;
			audioChunksRef.current = [];

			mediaRecorder.ondataavailable = (event) => {
				if (event.data.size > 0) {
					audioChunksRef.current.push(event.data);
				}
			};

			mediaRecorder.onstop = () => {
				const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
				onRecordingComplete(audioBlob);
				stream.getTracks().forEach((track) => track.stop());
			};

			mediaRecorder.start();
			setIsRecording(true);
			setRecordingTime(0);
			timerRef.current = setInterval(() => {
				setRecordingTime((prev) => prev + 1);
			}, 1000);
		} catch (error) {
			console.error("Error accessing microphone:", error);
			alert("Не удалось получить доступ к микрофону");
		}
	};

	const stopRecording = () => {
		if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
			mediaRecorderRef.current.stop();
			setIsRecording(false);
			if (timerRef.current) {
				clearInterval(timerRef.current);
			}
		}
	};

	const formatTime = (seconds) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	if (!isRecording) {
		return (
			<button
				type="button"
				onClick={startRecording}
				className="p-2 text-blue-500 hover:bg-gray-600 rounded-full transition-colors"
				title="Записать голосовое сообщение"
			>
				<BsMic className="w-5 h-5" />
			</button>
		);
	}

	return (
		<div className="flex items-center gap-2 px-3 py-2 bg-red-500/20 rounded-lg">
			<div className="flex items-center gap-2">
				<div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
				<span className="text-sm text-white">{formatTime(recordingTime)}</span>
			</div>
			<button
				type="button"
				onClick={stopRecording}
				className="p-1 text-red-500 hover:bg-red-500/20 rounded-full transition-colors"
				title="Остановить запись"
			>
				<BsStopCircle className="w-5 h-5" />
			</button>
			<button
				type="button"
				onClick={() => {
					if (mediaRecorderRef.current) {
						mediaRecorderRef.current.stop();
					}
					onCancel();
				}}
				className="text-sm text-gray-300 hover:text-white px-2 py-1 rounded"
			>
				Отмена
			</button>
		</div>
	);
};

export default AudioRecorder;





