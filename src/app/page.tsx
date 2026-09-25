"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import StorageStats from "@/components/StorageStats";
import FileCard from "@/components/FileCard";
import FileListItem from "@/components/FileListItem";
import FileUploadModal from "@/components/FileUploadModal";
import FilePreviewModal from "@/components/FilePreviewModal";
import RenameModal from "@/components/RenameModal";
import DeleteModal from "@/components/DeleteModal";
import { FileMetadata } from "@/lib/file-utils";
import {
  Search,
  LayoutGrid,
  List as ListIcon,
  UploadCloud,
  FolderOpen,
  ArrowUpDown,
  Filter,
  Loader2,
  AlertCircle,
  Database,
} from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarColor?: string;
}

interface StatsData {
  totalBytes: number;
  totalFiles: number;
  quotaBytes: number;
  byCategory: Record<string, { bytes: number; count: number }>;
}

export default function DashboardPage() {
  const router = useRouter();

  // Authentication & User state
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Files & Filtering state
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [filesLoading, setFilesLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState<string>("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileMetadata | null>(null);
  const [renameFile, setRenameFile] = useState<FileMetadata | null>(null);
  const [deleteFile, setDeleteFile] = useState<FileMetadata | null>(null);

  // Errors & notification state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Check user authentication
  const checkAuth = useCallback(async () => {
    try {
      setAuthLoading(true);
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        router.push("/auth");
        return;
      }
      const data = await res.json();
      setUser(data.user);
    } catch (err) {
      router.push("/auth");
    } finally {
      setAuthLoading(false);
    }
  }, [router]);

  // 2. Fetch files list
  const fetchFiles = useCallback(async () => {
    try {
      setFilesLoading(true);
      setErrorMessage(null);

      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== "all") {
        params.append("category", selectedCategory);
      }
      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }
      if (sortOption) {
        params.append("sort", sortOption);
      }

      const res = await fetch(`/api/files?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al cargar archivos");
      }

      setFiles(data.files || []);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Error al conectar con la base de datos MongoDB"
      );
    } finally {
      setFilesLoading(false);
    }
  }, [selectedCategory, searchTerm, sortOption]);

  // 3. Fetch storage stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/files/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Error al cargar stats:", err);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (user) {
      fetchFiles();
      fetchStats();
    }
  }, [user, fetchFiles, fetchStats]);

  // Handle Logout
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/auth");
    } catch (err) {
      router.push("/auth");
    }
  };

  // Handle Download
  const handleDownload = (file: FileMetadata) => {
    const downloadUrl = `/api/files/${file._id}/download`;
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = file.originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle Delete Confirmation
  const handleDeleteConfirm = async () => {
    if (!deleteFile) return;
    try {
      const res = await fetch(`/api/files/${deleteFile._id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al eliminar");
      }
      fetchFiles();
      fetchStats();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error al eliminar archivo");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
        <p className="text-sm text-slate-400">Verificando sesión segura...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 pb-16">
      {/* Top Navigation */}
      <Navbar
        user={user}
        onOpenUpload={() => setIsUploadOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {/* Error notification banner if DB error */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-rose-300">
                Aviso de conexión con MongoDB
              </p>
              <p className="text-xs text-rose-400/90 mt-0.5">
                {errorMessage}. Asegúrate de que tu variable de entorno{" "}
                <code className="bg-rose-950/60 px-1 py-0.5 rounded font-mono">
                  MONGODB_URI
                </code>{" "}
                esté configurada con tu instancia local o clúster de MongoDB
                Atlas.
              </p>
            </div>
          </div>
        )}

        {/* Storage Analytics Overview */}
        <StorageStats
          stats={stats}
          onFilterCategory={(cat) => setSelectedCategory(cat)}
          selectedCategory={selectedCategory}
        />

        {/* Toolbar: Search, Filters, View Modes */}
        <div className="glass-panel p-4 rounded-2xl mb-6 border border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, nota o etiqueta..."
              className="w-full pl-10 pr-4 py-2 rounded-xl glass-input text-xs sm:text-sm text-slate-100 placeholder:text-slate-500"
            />
          </div>

          {/* Right Toolbar Controls */}
          <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 w-full md:w-auto">
            {/* Category Select Dropdown */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Filter className="w-3.5 h-3.5" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-slate-200 py-1.5 px-2.5 rounded-xl text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="all">Todas las categorías</option>
                <option value="pdf">Solo PDFs</option>
                <option value="image">Solo Imágenes</option>
                <option value="word">Solo Word</option>
                <option value="powerpoint">Solo PowerPoint</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-slate-200 py-1.5 px-2.5 rounded-xl text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="newest">Más recientes</option>
                <option value="oldest">Más antiguos</option>
                <option value="name">Nombre (A-Z)</option>
                <option value="size_desc">Mayor tamaño</option>
                <option value="size_asc">Menor tamaño</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setViewMode("grid")}
                title="Vista en cuadrícula"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                title="Vista en lista"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === "list"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Files Content Section */}
        {filesLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
            <p className="text-sm">Cargando tus archivos desde MongoDB...</p>
          </div>
        ) : files.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center p-12 sm:p-16 rounded-3xl glass-panel border border-slate-800/80 text-center my-6">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
              <FolderOpen className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-200">
              {searchTerm || selectedCategory !== "all"
                ? "No se encontraron archivos con ese criterio"
                : "No has subido ningún archivo todavía"}
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md">
              {searchTerm || selectedCategory !== "all"
                ? "Intenta modificar tu búsqueda o seleccionar otra categoría."
                : "Comienza a subir tus documentos en PDF, imágenes, archivos de Word (.doc, .docx) o presentaciones de PowerPoint (.ppt, .pptx)."}
            </p>
            <button
              onClick={() => setIsUploadOpen(true)}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              Subir Mi Primer Archivo
            </button>
          </div>
        ) : viewMode === "grid" ? (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {files.map((file) => (
              <FileCard
                key={file._id}
                file={file}
                onPreview={(f) => setPreviewFile(f)}
                onDownload={handleDownload}
                onRename={(f) => setRenameFile(f)}
                onDelete={(f) => setDeleteFile(f)}
              />
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-2.5">
            {files.map((file) => (
              <FileListItem
                key={file._id}
                file={file}
                onPreview={(f) => setPreviewFile(f)}
                onDownload={handleDownload}
                onRename={(f) => setRenameFile(f)}
                onDelete={(f) => setDeleteFile(f)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      <FileUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={() => {
          fetchFiles();
          fetchStats();
        }}
      />

      <FilePreviewModal
        file={previewFile}
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        onDownload={handleDownload}
      />

      <RenameModal
        file={renameFile}
        isOpen={!!renameFile}
        onClose={() => setRenameFile(null)}
        onSuccess={() => {
          fetchFiles();
        }}
      />

      <DeleteModal
        file={deleteFile}
        isOpen={!!deleteFile}
        onClose={() => setDeleteFile(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
