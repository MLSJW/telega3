import { useState } from "react";
import { useAuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const { authUser, setAuthUser } = useAuthContext();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: authUser?.fullName || "",
    username: authUser?.username || "",
    password: "",
    confirmPassword: ""
  });
  const [profilePic, setProfilePic] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      if (form.password && form.password !== form.confirmPassword) {
        setError("Пароли не совпадают");
        setLoading(false);
        return;
      }
      const formData = new FormData();
      formData.append("fullName", form.fullName);
      formData.append("username", form.username);
      if (form.password) formData.append("password", form.password);
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
      navigate("/");
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Вы уверены, что хотите удалить аккаунт? Это действие необратимо!")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "DELETE",
        credentials: "include"
      });
      const data = await res.json();
      if (!data.success) throw new Error("Ошибка при удалении аккаунта");
      setAuthUser(null);
      navigate("/signup");
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-gray-800 p-6 rounded-xl shadow-xl text-white">
      <h2 className="text-2xl font-bold mb-4">Настройки профиля</h2>
      {error && <div className="bg-red-600 p-2 mb-2 rounded">{error}</div>}
      <form onSubmit={handleSave}>
        <div className="mb-4">
          <label className="block mb-2">Имя и фамилия:</label>
          <input type="text" className="w-full p-2 rounded bg-gray-700" name="fullName" value={form.fullName} onChange={handleChange} required />
        </div>
        <div className="mb-4">
          <label className="block mb-2">Username:</label>
          <input type="text" className="w-full p-2 rounded bg-gray-700" name="username" value={form.username} onChange={handleChange} required />
        </div>
        <div className="mb-4">
          <label className="block mb-2">Новый пароль:</label>
          <input type="password" className="w-full p-2 rounded bg-gray-700" name="password" value={form.password} onChange={handleChange} />
        </div>
        <div className="mb-4">
          <label className="block mb-2">Подтвердите новый пароль:</label>
          <input type="password" className="w-full p-2 rounded bg-gray-700" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} />
        </div>
        <div className="mb-4">
          <label className="block mb-2">Изменить аватар:</label>
          <input type="file" accept="image/*" onChange={handleFileChange} className="w-full p-2 bg-gray-700 rounded" />
        </div>
        <button type="submit" className="w-full p-2 bg-blue-600 rounded hover:bg-blue-700 mt-2" disabled={loading}>{loading ? "Сохраняю..." : "Сохранить изменения"}</button>
      </form>
      <button onClick={handleDelete} className="w-full p-2 bg-red-600 rounded hover:bg-red-700 mt-4" disabled={loading}>{loading ? "Удаление..." : "Удалить аккаунт"}</button>
    </div>
  );
};

export default Settings;

