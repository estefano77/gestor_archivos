export type FileCategory = "pdf" | "image" | "word" | "powerpoint" | "other";

export interface FileMetadata {
  _id: string;
  originalName: string;
  mimeType: string;
  category: FileCategory;
  size: number;
  description?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Detects file category based on MIME type and extension
 */
export function getFileCategory(mimeType: string, filename: string): FileCategory {
  const lowerName = filename.toLowerCase();
  const lowerMime = mimeType.toLowerCase();

  if (lowerMime === "application/pdf" || lowerName.endsWith(".pdf")) {
    return "pdf";
  }

  if (
    lowerMime.startsWith("image/") ||
    lowerName.endsWith(".png") ||
    lowerName.endsWith(".jpg") ||
    lowerName.endsWith(".jpeg") ||
    lowerName.endsWith(".webp") ||
    lowerName.endsWith(".gif") ||
    lowerName.endsWith(".svg")
  ) {
    return "image";
  }

  if (
    lowerMime === "application/msword" ||
    lowerMime ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lowerName.endsWith(".docx") ||
    lowerName.endsWith(".doc")
  ) {
    return "word";
  }

  if (
    lowerMime === "application/vnd.ms-powerpoint" ||
    lowerMime ===
      "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
    lowerName.endsWith(".pptx") ||
    lowerName.endsWith(".ppt")
  ) {
    return "powerpoint";
  }

  return "other";
}

/**
 * Formats bytes to human-readable format (KB, MB, GB)
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Returns user-friendly UI meta info per category
 */
export function getCategoryMeta(category: FileCategory) {
  switch (category) {
    case "pdf":
      return {
        label: "PDF",
        badgeBg: "bg-rose-500/10 text-rose-500 border-rose-500/20",
        badgeSolid: "bg-rose-600 text-white",
        iconColor: "text-rose-500",
        cardBorder: "hover:border-rose-500/40",
        gradient: "from-rose-500/20 to-orange-500/10",
      };
    case "image":
      return {
        label: "Imagen",
        badgeBg: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        badgeSolid: "bg-emerald-600 text-white",
        iconColor: "text-emerald-500",
        cardBorder: "hover:border-emerald-500/40",
        gradient: "from-emerald-500/20 to-teal-500/10",
      };
    case "word":
      return {
        label: "Word",
        badgeBg: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        badgeSolid: "bg-blue-600 text-white",
        iconColor: "text-blue-500",
        cardBorder: "hover:border-blue-500/40",
        gradient: "from-blue-500/20 to-indigo-500/10",
      };
    case "powerpoint":
      return {
        label: "PowerPoint",
        badgeBg: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        badgeSolid: "bg-amber-600 text-white",
        iconColor: "text-amber-500",
        cardBorder: "hover:border-amber-500/40",
        gradient: "from-amber-500/20 to-orange-500/10",
      };
    default:
      return {
        label: "Archivo",
        badgeBg: "bg-slate-500/10 text-slate-400 border-slate-500/20",
        badgeSolid: "bg-slate-600 text-white",
        iconColor: "text-slate-400",
        cardBorder: "hover:border-slate-500/40",
        gradient: "from-slate-500/20 to-zinc-500/10",
      };
  }
}

/**
 * Accepted extensions string for file inputs
 */
export const ACCEPTED_EXTENSIONS =
  ".pdf,.png,.jpg,.jpeg,.gif,.webp,.svg,.doc,.docx,.ppt,.pptx";
