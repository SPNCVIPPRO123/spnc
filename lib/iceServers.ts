import "server-only";

// Máy chủ giúp hai máy tìm đường nối với nhau.
// STUN (miễn phí, không cần tài khoản) đủ cho phần lớn mạng nhà và 4G.
// Một số mạng (mạng trường, công ty, vài nhà mạng) chặn nối thẳng: khi đó cần thêm TURN để chuyển tiếp hình và tiếng.
// TURN miễn phí của Cloudflare (1000 GB mỗi tháng): đặt CLOUDFLARE_TURN_KEY_ID và CLOUDFLARE_TURN_API_TOKEN trên Vercel
// (xem README). Không đặt thì web vẫn gọi được bằng STUN.

export type IceServer = { urls: string | string[]; username?: string; credential?: string };

const STUN: IceServer[] = [{ urls: ["stun:stun.cloudflare.com:3478", "stun:stun.l.google.com:19302"] }];

export function hasTurn(): boolean {
  return Boolean(process.env.CLOUDFLARE_TURN_KEY_ID && process.env.CLOUDFLARE_TURN_API_TOKEN);
}

export async function iceServers(): Promise<IceServer[]> {
  const keyId = process.env.CLOUDFLARE_TURN_KEY_ID;
  const token = process.env.CLOUDFLARE_TURN_API_TOKEN;
  if (!keyId || !token) return STUN;
  try {
    const res = await fetch(`https://rtc.live.cloudflare.com/v1/turn/keys/${keyId}/credentials/generate-ice-servers`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      // Mật khẩu TURN tạm thời, hết hạn sau 4 giờ.
      body: JSON.stringify({ ttl: 4 * 3600 }),
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`Cloudflare TURN ${res.status}`);
    const data = (await res.json()) as { iceServers?: IceServer | IceServer[] };
    const extra = Array.isArray(data.iceServers) ? data.iceServers : data.iceServers ? [data.iceServers] : [];
    return [...STUN, ...extra];
  } catch (err) {
    console.error("Không lấy được TURN, dùng STUN", err);
    return STUN;
  }
}
