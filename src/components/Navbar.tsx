"use client";

import React from "react";
import { FolderLock, LogOut, UploadCloud, User as UserIcon } from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarColor?: string;
}

interface NavbarProps {
  user: UserProfile | null;
  onOpenUpload: () => void;
  onLogout: () => void;
}

export default function Navbar({ user, onOpenUpload, onLogout }: NavbarProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-pink-500 shadow-lg shadow-indigo-500/25">
            <FolderLock className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                CloudVault
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                MongoDB
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Gestor Seguro de Documentos y Multimedia
            </p>
          </div>
        </div>

        {/* Right Section: Actions & User Info */}
        <div className="flex items-center gap-3">
          {user && (
            <>
              {/* Upload Button */}
              <button
                id="btn-open-upload"
                onClick={onOpenUpload}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-95 transition-all shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/40 cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                <span className="hidden sm:inline">Subir Archivo</span>
                <span className="sm:hidden">Subir</span>
              </button>

              {/* User Avatar & Info */}
              <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-slate-800">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white shadow-inner"
                  style={{
                    backgroundColor: user.avatarColor || "#6366f1",
                  }}
                  title={user.email}
                >
                  {getInitials(user.name) || <UserIcon className="w-4 h-4" />}
                </div>

                <div className="hidden md:block text-left text-xs">
                  <p className="font-medium text-slate-200 max-w-[130px] truncate">
                    {user.name}
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-[130px] truncate">
                    {user.email}
                  </p>
                </div>

                {/* Logout Button */}
                <button
                  id="btn-logout"
                  onClick={onLogout}
                  title="Cerrar sesión"
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
