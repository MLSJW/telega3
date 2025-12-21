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
    <div className="max-w-md mx-auto bg-gray-800 p-9 rounded-xl shadow-xl text-white relative min-h-[475px]">
      <button 
        onClick={() => navigate("/")} 
        className="absolute top-3 right-3 text-white hover:text-gray-400 text-3xl font-bold"
      >
        &times;
      </button>
      <h2 className="text-2xl font-bold mb-6 text-center">Профиль</h2>
      
      {/* Аватар */}
      <div className="flex justify-center mb-6">
        {authUser?.profilePic || profilePic ? (
          <img 
            src={profilePic ? URL.createObjectURL(profilePic) : authUser?.profilePic} 
            alt="Аватар" 
            className="w-32 h-32 rounded-full object-cover border-4 border-blue-600"
          />
        ) : (
          <div className="w-32 h-32 rounded-full bg-gray-600 flex items-center justify-center border-4 border-blue-600">
            <span className="text-gray-400">Нет аватара</span>
          </div>
        )}
      </div>
      
      {error && <div className="bg-red-600 p-2 mb-2 rounded">{error}</div>}
      <form onSubmit={handleSave}>
        {/* Имя и фамилия - только поле ввода без надписи */}
        <div className="mb-4 text-center">
          <p className="text-xl text-white">{form.fullName || authUser?.fullName}</p>
          <p className="text-sm text-blue-400">В сети</p>
        </div>
        
        {/* Username - отображение */}
        <div className="mb-4">
          <p className="text-lg text-white">@{form.username || authUser?.username}</p>
          <p className="text-sm text-gray-400">Имя пользователя</p>
        </div>
        
      </form>
      <button onClick={handleDelete} className="w-full p-2 bg-red-600 rounded hover:bg-red-700 mt-4" disabled={loading}>{loading ? "Удаление..." : "Удалить аккаунт"}</button>
    </div>
  );
};

export default Settings;
