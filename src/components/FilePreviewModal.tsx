"use client";

import React, { useState } from "react";
import { FileMetadata, formatBytes, getCategoryMeta } from "@/lib/file-utils";
import {
  X,
  Download,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  FileCode2,
  Presentation,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Calendar,
  Tag,
  Info,
} from "lucide-react";

interface FilePreviewModalProps {
  file: FileMetadata | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (file: FileMetadata) => void;
}

export default function FilePreviewModal({
  file,
  isOpen,
  onClose,
  onDownload,
}: FilePreviewModalProps) {
  const [imageScale, setImageScale] = useState(1);

  if (!isOpen || !file) return null;

  const meta = getCategoryMeta(file.category);
  const previewUrl = `/api/files/${file._id}/preview`;

  const formattedDate = new Date(file.createdAt).toLocaleString("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const handleZoomIn = () => setImageScale((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setImageScale((prev) => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setImageScale(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[92vh] flex flex-col glass-panel bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 ${meta.badgeSolid}`}
            >
              {file.category === "pdf" && <FileText className="w-5 h-5" />}
              {file.category === "image" && <ImageIcon className="w-5 h-5" />}
              {file.category === "word" && <FileCode2 className="w-5 h-5" />}
              {file.category === "powerpoint" && (
                <Presentation className="w-5 h-5" />
              )}
            </div>

            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-100 truncate max-w-xs sm:max-w-md md:max-w-lg">
                {file.originalName}
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span
                  className={`text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded border ${meta.badgeBg}`}
                >
                  {meta.label}
                </span>
                <span>•</span>
                <span>{formatBytes(file.size)}</span>
              </div>
            </div>
          </div>

          {/* Action buttons in header */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onDownload(file)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Descargar</span>
            </button>

            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="Abrir en pestaña nueva"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Cerrar vista previa"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 relative bg-slate-950/90 overflow-hidden flex items-center justify-center p-2 sm:p-4">
          {/* 1. PDF Preview: Embedded native viewer */}
          {file.category === "pdf" && (
            <div className="w-full h-full rounded-xl overflow-hidden border border-slate-800 bg-white">
              <iframe
                src={`${previewUrl}#toolbar=1`}
                className="w-full h-full border-0"
                title={file.originalName}
              />
            </div>
          )}

          {/* 2. Image Preview: Zoomable image */}
          {file.category === "image" && (
            <div className="relative w-full h-full flex flex-col items-center justify-center overflow-auto p-4">
              <div
                className="transition-transform duration-200 flex items-center justify-center max-w-full max-h-full"
                style={{ transform: `scale(${imageScale})` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt={file.originalName}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl border border-slate-800"
                />
              </div>

              {/* Floating Zoom Controls */}
              <div className="absolute bottom-6 flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-panel bg-slate-900/90 border border-slate-700 shadow-xl">
                <button
                  onClick={handleZoomOut}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Alejar"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono text-slate-300 px-1">
                  {Math.round(imageScale * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Acercar"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={handleResetZoom}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Restablecer tamaño"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* 3. Word & PowerPoint: Visual Inspector Card */}
          {(file.category === "word" || file.category === "powerpoint") && (
            <div className="max-w-md w-full glass-card p-6 sm:p-8 rounded-2xl border border-slate-800 text-center flex flex-col items-center shadow-2xl">
              <div
                className={`w-20 h-20 rounded-3xl flex items-center justify-center text-white mb-4 shadow-xl ${meta.badgeSolid}`}
              >
                {file.category === "word" ? (
                  <FileCode2 className="w-10 h-10" />
                ) : (
                  <Presentation className="w-10 h-10" />
                )}
              </div>

              <span
                className={`text-xs uppercase font-extrabold px-2.5 py-1 rounded-full border mb-2 ${meta.badgeBg}`}
              >
                Documento de Microsoft {meta.label}
              </span>

              <h3 className="text-base sm:text-lg font-bold text-slate-100 break-all mb-1">
                {file.originalName}
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                Tamaño: {formatBytes(file.size)} • Formato nativo compatible
              </p>

              <div className="w-full bg-slate-950/60 rounded-xl p-3.5 border border-slate-800/80 text-left space-y-2 mb-6 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Tipo MIME:</span>
                  <span className="font-mono text-slate-300 truncate max-w-[200px]">
                    {file.mimeType}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Subido el:</span>
                  <span className="text-slate-300">{formattedDate}</span>
                </div>
                {file.description && (
                  <div className="pt-2 border-t border-slate-800 text-slate-300">
                    <span className="text-slate-500 font-semibold block text-[11px]">
                      Nota:
                    </span>
                    {file.description}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <button
                  onClick={() => onDownload(file)}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all shadow-lg shadow-indigo-600/30"
                >
                  <Download className="w-4 h-4" />
                  Descargar Documento
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-950/80 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              Subido: {formattedDate}
            </span>
            {file.tags && file.tags.length > 0 && (
              <span className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-500" />
                {file.tags.join(", ")}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <Info className="w-3.5 h-3.5" />
            <span>Almacenado de forma segura en MongoDB</span>
          </div>
        </div>
      </div>
    </div>
  );
}
