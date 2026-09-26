import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import FileItem from "@/models/FileItem";
import mongoose from "mongoose";
import { USER_QUOTA_BYTES } from "@/lib/file-utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getRequestUser(req);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await connectToDatabase();

    const userObjectId = new mongoose.Types.ObjectId(user.userId);

    const stats = await FileItem.aggregate([
      { $match: { userId: userObjectId } },
      {
        $group: {
          _id: "$category",
          totalBytes: { $sum: "$size" },
          count: { $sum: 1 },
        },
      },
    ]);

    let totalBytes = 0;
    let totalFiles = 0;

    const byCategory: Record<string, { bytes: number; count: number }> = {
      pdf: { bytes: 0, count: 0 },
      image: { bytes: 0, count: 0 },
      word: { bytes: 0, count: 0 },
      excel: { bytes: 0, count: 0 },
      powerpoint: { bytes: 0, count: 0 },
      other: { bytes: 0, count: 0 },
    };

    stats.forEach((item) => {
      const cat = item._id as string;
      if (byCategory[cat]) {
        byCategory[cat].bytes = item.totalBytes;
        byCategory[cat].count = item.count;
      }
      totalBytes += item.totalBytes;
      totalFiles += item.count;
    });

    return NextResponse.json({
      totalBytes,
      totalFiles,
      byCategory,
      quotaBytes: USER_QUOTA_BYTES,
    });
  } catch (error: unknown) {
    console.error("Error al calcular estadísticas:", error);
    return NextResponse.json(
      { error: "Error al calcular estadísticas" },
      { status: 500 }
    );
  }
}
