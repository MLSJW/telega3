import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		let uploadPath = "";
		if (file.mimetype.startsWith("image/")) {
			uploadPath = "/data/uploads/images";
		} else if (file.mimetype.startsWith("audio/")) {
			uploadPath = "/data/uploads/audio";
		} else {
			return cb(new Error("Неподдерживаемый тип файла"));
		}
		// Ensure directory exists
		if (!fs.existsSync(uploadPath)) {
			fs.mkdirSync(uploadPath, { recursive: true });
		}
		cb(null, uploadPath);
	},
	filename: function (req, file, cb) {
	
		const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
		const ext = path.extname(file.originalname);
		cb(null, file.fieldname + "-" + uniqueSuffix + ext);
	},
});


const fileFilter = (req, file, cb) => {
	if (file.mimetype.startsWith("image/")) {
		cb(null, true);
	} else if (file.mimetype.startsWith("audio/")) {
		cb(null, true);
	} else {
		cb(new Error("Разрешены только изображения и аудио файлы"), false);
	}
};

const upload = multer({
	storage: storage,
	limits: {
		fileSize: 50 * 1024 * 1024, 
	},
	fileFilter: fileFilter,
});

export default upload;





