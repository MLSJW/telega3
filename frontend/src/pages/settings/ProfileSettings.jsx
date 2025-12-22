import { useState } from "react";
import { useAuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../utils/api";
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

const ProfileSettings = () => {
  const { authUser, setAuthUser } = useAuthContext();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: authUser?.fullName || "",
    username: authUser?.username || "",
    password: "",
    confirmPassword: ""
  });
  const [profilePic, setProfilePic] = useState(null);
  const [crop, setCrop] = useState({ unit: '%', width: 50, aspect: 1 });
  const [completedCrop, setCompletedCrop] = useState(null);
  const [imageRef, setImageRef] = useState(null);
  const [showCrop, setShowCrop] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfilePic(file);
    setShowCrop(true);
    setCompletedCrop(null);
  };

  const getCroppedImg = (image, crop) => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.95);
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (showPasswordForm && form.password !== form.confirmPassword) {
        setError("Пароли не совпадают");
        setLoading(false);
        return;
      }
      const formData = new FormData();
      formData.append("fullName", form.fullName);
      formData.append("username", form.username);
      if (showPasswordForm && form.password) formData.append("password", form.password);
      if (profilePic && completedCrop) {
        const croppedImg = await getCroppedImg(imageRef, completedCrop);
        formData.append("profilePic", croppedImg, "profile.jpg");
      }

      const res = await apiFetch("/api/users/me", {
        method: "PATCH",
        body: formData
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAuthUser(data);
      setLoading(false);
      navigate("/profile");
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-gray-800 p-9 rounded-xl shadow-xl text-white relative">
      <button 
        onClick={() => navigate("/")} 
        className="absolute top-3 right-3 text-white hover:text-gray-400 text-3xl font-bold"
      >
        &times;
      </button>
      <h2 className="text-2xl font-bold mb-6 text-center">Настройки профиля</h2>
      
      {error && <div className="bg-red-600 p-2 mb-2 rounded">{error}</div>}

      <button 
        onClick={() => setShowPasswordForm(!showPasswordForm)}
        className="w-full p-2 bg-gray-700 rounded hover:bg-gray-600 transition-colors mb-4"
      >
        {showPasswordForm ? "Скрыть поля пароля" : "Сменить пароль"}
      </button>

      <form onSubmit={handleSave}>
        {showPasswordForm && (
          <div className="transition-all duration-300 overflow-hidden" style={{ maxHeight: showPasswordForm ? "200px" : "0" }}>
            <div className="mb-4">
              <label className="block mb-2">Новый пароль:</label>
              <input type="password" className="w-full p-2 rounded bg-gray-700" name="password" value={form.password} onChange={handleChange} />
            </div>
            <div className="mb-4">
              <label className="block mb-2">Подтвердите новый пароль:</label>
              <input type="password" className="w-full p-2 rounded bg-gray-700" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} />
            </div>
          </div>
        )}
        <div className="mb-4">
          <label className="block mb-2">Имя:</label>
          <input type="text" className="w-full p-2 rounded bg-gray-700" name="fullName" value={form.fullName} onChange={handleChange} />
        </div>
        <div className="mb-4">
          <label className="block mb-2">Username:</label>
          <input type="text" className="w-full p-2 rounded bg-gray-700" name="username" value={form.username} onChange={handleChange} />
        </div>
        <div className="mb-4">
          <label className="block mb-2">Изменить аватар:</label>
          <input type="file" accept="image/*" onChange={handleFileChange} className="w-full p-2 bg-gray-700 rounded" />
          {showCrop && profilePic && (
            <div className="mt-4">
              <ReactCrop
                src={URL.createObjectURL(profilePic)}
                crop={crop}
                onChange={setCrop}
                onComplete={setCompletedCrop}
                onImageLoaded={(img) => setImageRef(img)}
                circularCrop
              />
            </div>
          )}
        </div>
        <button type="submit" className="w-full p-2 bg-blue-600 rounded hover:bg-blue-700 mt-2" disabled={loading}>{loading ? "Сохраняю..." : "Сохранить изменения"}</button>
      </form>
    </div>
  );
};

export default ProfileSettings;

