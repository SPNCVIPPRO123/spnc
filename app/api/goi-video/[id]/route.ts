import { NextResponse, type NextRequest } from "next/server";
import { hasDatabase } from "@/lib/db";
import { SIGNAL_KINDS, callAccess, postSignal, readSignals } from "@/lib/callData";

// Trạm chuyển tin bắt tay cho cuộc gọi video: hai trình duyệt gửi và nhận thông tin kết nối qua đây,
// sau đó hình và tiếng đi thẳng giữa hai máy. Mỗi yêu cầu đều kiểm tra lại quyền vào phòng.

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };
const MAX_BODY = 20_000;

async function access(req: NextRequest, id: string) {
  if (!hasDatabase()) return { error: NextResponse.json({ error: "no-db" }, { status: 503, headers: noStore }) };
  const call = await callAccess(id, req.nextUrl.searchParams.get("vai"));
  if (typeof call === "string")
    return { error: NextResponse.json({ error: call }, { status: call === "dang-nhap" ? 401 : 403, headers: noStore }) };
  if (call.timing !== "mo")
    return { error: NextResponse.json({ error: call.timing }, { status: 409, headers: noStore }) };
  return { call };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { call, error } = await access(req, id);
  if (error) return error;
  const after = Math.max(0, Number(req.nextUrl.searchParams.get("sau")) || 0);
  const signals = await readSignals(call, after);
  return NextResponse.json({ signals }, { headers: noStore });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const raw = await req.text();
  if (raw.length > MAX_BODY) return NextResponse.json({ error: "too-big" }, { status: 413 });
  let body: { sid?: unknown; to?: unknown; kind?: unknown; payload?: unknown };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad-json" }, { status: 400 });
  }
  const sid = typeof body.sid === "string" && /^[\w-]{8,64}$/.test(body.sid) ? body.sid : null;
  const to = typeof body.to === "string" && /^[\w-]{8,64}$/.test(body.to) ? body.to : null;
  const kind = SIGNAL_KINDS.find((k) => k === body.kind);
  if (!sid || !kind) return NextResponse.json({ error: "bad-signal" }, { status: 400 });

  const { call, error } = await access(req, id);
  if (error) return error;
  const signalId = await postSignal(call, sid, to, kind, body.payload);
  if (signalId === null) return NextResponse.json({ error: "too-many" }, { status: 429, headers: noStore });
  return NextResponse.json({ id: signalId }, { headers: noStore });
}
