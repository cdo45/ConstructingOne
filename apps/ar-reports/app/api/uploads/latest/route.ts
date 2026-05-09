import { NextResponse } from "next/server";
import { getLatestActiveUpload } from "@/lib/uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    const [arDetail, arAging] = await Promise.all([
      getLatestActiveUpload("ar_detail"),
      getLatestActiveUpload("ar_aging"),
    ]);
    return NextResponse.json({ ar_detail: arDetail, ar_aging: arAging });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
