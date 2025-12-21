import { useState } from "react";
import { useAuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const ProfileSettings = () => {
  const { authUser, setAuthUser } = useAuthContext();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    password: "",
    confirmPassword: ""
  });
  const [profilePic, setProfilePic] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = e => {
    setProfilePic(e.target.files[0]);
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
      if (showPasswordForm && form.password) formData.append("password", form.password);
      if (profilePic) formData.append("profilePic", profilePic);

      const res = await fetch("/api/users/me", {
        method: "PATCH",
        credentials: "include",
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
          <label className="block mb-2">Изменить аватар:</label>
          <input type="file" accept="image/*" onChange={handleFileChange} className="w-full p-2 bg-gray-700 rounded" />
        </div>
        <button type="submit" className="w-full p-2 bg-blue-600 rounded hover:bg-blue-700 mt-2" disabled={loading}>{loading ? "Сохраняю..." : "Сохранить изменения"}</button>
      </form>
    </div>
  );
};

export default ProfileSettings;

