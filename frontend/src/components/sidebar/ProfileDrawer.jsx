import React from "react";
import { useAuthContext } from "../../context/AuthContext";

const ProfileDrawer = ({ open, onClose }) => {
  const { authUser } = useAuthContext();
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-40 flex">
      <div className="bg-slate-900 w-64 p-6 h-full shadow-lg z-50 flex flex-col relative animate-slide-in">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white text-2xl">×</button>
        <div className="flex flex-col items-center mt-8 mb-6">
          <img
                  src={authUser?.profilePic ? authUser.profilePic + "?t=" + Date.now() : "/uploads/images/default-avatar.png"}
            alt="Аватар"
            className="w-20 h-20 rounded-full border-4 border-slate-600 object-cover mb-4"
          />
          <h3 className="text-white font-bold text-lg mb-1">{authUser?.username || "Пользователь"}</h3>
        </div>
        <a
          href="/profile"
          className="p-2 mt-2 text-sm flex items-center rounded hover:bg-blue-700 text-slate-100 transition-colors"
        >
          Мой профиль
        </a>
        <a
          href="/profile/settings"
          className="p-2 mt-2 text-sm flex items-center rounded hover:bg-blue-700 text-slate-100 transition-colors"
        >
          Настройки профиля
        </a>
      </div>
      {/* Щелчок вне меню закрывает */}
      <div className="flex-1" onClick={onClose}></div>
    </div>
  );
};

export default ProfileDrawer;