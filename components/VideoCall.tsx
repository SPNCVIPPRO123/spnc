"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Mic, MicOff, PhoneOff, RefreshCw, Video, VideoOff } from "lucide-react";

// Cuộc gọi video một-một giữa học sinh và chuyên viên, chạy ngay trong trình duyệt (WebRTC).
// Hai trình duyệt trao đổi thông tin kết nối qua /api/goi-video/[id]; hình và tiếng đi thẳng giữa hai máy
// (hoặc qua máy chủ TURN nếu có đặt), không đi qua máy chủ của web và không được ghi lại.
//
// Cách bắt tay: ai vào phòng cũng gửi "hello". Chuyên viên nhận "hello" của học sinh thì gửi lời mời (offer);
// học sinh nhận "hello" của chuyên viên thì chào lại để chuyên viên biết mà gửi lời mời. Nhờ vậy ai vào trước,
// ai tải lại trang cũng nối lại được.

type Role = "hs" | "cv";
type IceServer = { urls: string | string[]; username?: string; credential?: string };
type Signal = { id: number; sid: string; target: string | null; kind: string; payload: unknown };
type PeerState = "cho" | "dang-noi" | "da-noi" | "chap-chon" | "loi" | "roi";
type Closed = "tu-roi" | "het-gio" | "khong-quyen";

function makeId() {
  const a = new Uint8Array(12);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}

class CallEngine {
  readonly sid = makeId();
  private cursor = 0;
  private pc: RTCPeerConnection | null = null;
  private remoteSid: string | null = null;
  private pending: RTCIceCandidateInit[] = [];
  private stopped = false;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private chain: Promise<unknown> = Promise.resolve();
  private retries = 0;

  constructor(
    private o: {
      id: string;
      role: Role;
      ice: IceServer[];
      stream: MediaStream;
      onState: (s: PeerState) => void;
      onRemote: (s: MediaStream | null) => void;
      onClosed: (reason: Closed) => void;
    },
  ) {}

  private url(extra = "") {
    return `/api/goi-video/${this.o.id}?vai=${this.o.role}${extra}`;
  }

  private fatal(status: number) {
    if (status !== 401 && status !== 403 && status !== 409) return;
    this.stop(false);
    this.o.onClosed(status === 409 ? "het-gio" : "khong-quyen");
  }

  // Gửi lần lượt từng tin, để bên kia nhận đúng thứ tự (lời mời trước, địa chỉ mạng sau).
  private send(kind: string, payload?: unknown, to?: string | null): Promise<number | null> {
    const body = JSON.stringify({ sid: this.sid, to: to ?? null, kind, payload: payload ?? null });
    const p = this.chain.then(async () => {
      const res = await fetch(this.url(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: kind === "bye",
      });
      if (!res.ok) {
        this.fatal(res.status);
        return null;
      }
      return ((await res.json()) as { id: number }).id;
    });
    const safe = p.catch(() => null);
    this.chain = safe;
    return safe;
  }

  async start() {
    const id = await this.send("hello");
    if (this.stopped) return;
    if (id === null) {
      this.o.onState("loi");
      return;
    }
    this.cursor = id;
    this.o.onState("cho");
    void this.poll();
  }

  private async poll() {
    if (this.stopped) return;
    try {
      const res = await fetch(this.url(`&sau=${this.cursor}`), { cache: "no-store" });
      if (!res.ok) this.fatal(res.status);
      else {
        const { signals } = (await res.json()) as { signals: Signal[] };
        for (const s of signals) {
          if (this.stopped) return;
          this.cursor = Math.max(this.cursor, s.id);
          await this.handle(s).catch((err) => console.error("Lỗi xử lý tin bắt tay", err));
        }
      }
    } catch {
      // Mất mạng một lúc: thử lại ở lượt sau.
    }
    if (this.stopped) return;
    const settled = this.pc?.connectionState === "connected";
    this.timer = setTimeout(() => void this.poll(), settled ? 3000 : 1000);
  }

  private async handle(s: Signal) {
    if (s.target && s.target !== this.sid) return;
    const fromCurrent = s.sid === this.remoteSid;
    switch (s.kind) {
      case "hello":
        if (this.o.role === "cv") await this.makeOffer(s.sid);
        else await this.send("hello");
        break;
      case "offer":
        if (this.o.role === "hs") await this.acceptOffer(s.sid, s.payload as RTCSessionDescriptionInit);
        break;
      case "answer":
        if (this.o.role === "cv" && fromCurrent && this.pc && !this.pc.currentRemoteDescription) {
          await this.pc.setRemoteDescription(s.payload as RTCSessionDescriptionInit);
          await this.flushCandidates();
        }
        break;
      case "candidate":
        if (fromCurrent && this.pc && s.payload) {
          const c = s.payload as RTCIceCandidateInit;
          if (this.pc.remoteDescription) await this.pc.addIceCandidate(c).catch(() => {});
          else this.pending.push(c);
        }
        break;
      case "bye":
        if (fromCurrent) {
          this.closePeer();
          this.o.onState("roi");
        }
        break;
    }
  }

  private async flushCandidates() {
    const list = this.pending;
    this.pending = [];
    for (const c of list) await this.pc?.addIceCandidate(c).catch(() => {});
  }

  private newPeer(remoteSid: string): RTCPeerConnection {
    if (remoteSid !== this.remoteSid) this.retries = 0;
    this.closePeer();
    const pc = new RTCPeerConnection({ iceServers: this.o.ice });
    this.pc = pc;
    this.remoteSid = remoteSid;
    this.pending = [];
    const { stream } = this.o;
    for (const t of stream.getTracks()) pc.addTrack(t, stream);
    if (this.o.role === "cv") {
      // Không có camera hoặc micro thì vẫn nhận hình và tiếng của bên kia.
      if (!stream.getVideoTracks().length) pc.addTransceiver("video", { direction: "recvonly" });
      if (!stream.getAudioTracks().length) pc.addTransceiver("audio", { direction: "recvonly" });
    }
    pc.onicecandidate = (e) => {
      if (e.candidate && this.pc === pc) void this.send("candidate", e.candidate.toJSON(), remoteSid);
    };
    pc.ontrack = (e) => {
      if (this.pc === pc) this.o.onRemote(e.streams[0] ?? new MediaStream([e.track]));
    };
    pc.onconnectionstatechange = () => {
      if (this.pc !== pc) return;
      const st = pc.connectionState;
      if (st === "connected") {
        this.retries = 0;
        this.o.onState("da-noi");
      } else if (st === "disconnected") this.o.onState("chap-chon");
      else if (st === "failed") {
        // Chuyên viên thử nối lại vài lần; học sinh chờ lời mời mới.
        if (this.o.role === "cv" && this.retries < 3) {
          this.retries++;
          void this.makeOffer(remoteSid);
        } else this.o.onState("loi");
      }
    };
    this.o.onState("dang-noi");
    return pc;
  }

  private async makeOffer(remoteSid: string) {
    const pc = this.newPeer(remoteSid);
    const offer = await pc.createOffer();
    void this.send("offer", { type: offer.type, sdp: offer.sdp }, remoteSid);
    await pc.setLocalDescription(offer);
  }

  private async acceptOffer(fromSid: string, desc: RTCSessionDescriptionInit) {
    const pc = this.newPeer(fromSid);
    await pc.setRemoteDescription(desc);
    const answer = await pc.createAnswer();
    void this.send("answer", { type: answer.type, sdp: answer.sdp }, fromSid);
    await pc.setLocalDescription(answer);
    await this.flushCandidates();
  }

  private closePeer() {
    if (this.pc) {
      this.pc.onicecandidate = this.pc.ontrack = this.pc.onconnectionstatechange = null;
      this.pc.close();
    }
    this.pc = null;
    this.o.onRemote(null);
  }

  // Báo cho bên kia khi đóng trang (sendBeacon vẫn gửi được lúc trang đang tắt).
  beaconBye() {
    if (this.stopped) return;
    const body = JSON.stringify({ sid: this.sid, to: this.remoteSid, kind: "bye", payload: null });
    navigator.sendBeacon?.(this.url(), new Blob([body], { type: "text/plain" }));
  }

  stop(sayBye = true) {
    if (this.stopped) return;
    if (sayBye) void this.send("bye", null, this.remoteSid);
    this.stopped = true;
    clearTimeout(this.timer);
    this.closePeer();
  }
}

async function getMedia(): Promise<{ stream: MediaStream; problem: string | null }> {
  if (!navigator.mediaDevices?.getUserMedia) {
    return { stream: new MediaStream(), problem: "Trình duyệt này không hỗ trợ gọi video. Em thử Chrome, Edge hoặc Safari bản mới nhé." };
  }
  const audio = { echoCancellation: true, noiseSuppression: true, autoGainControl: true };
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
      audio,
    });
    return { stream, problem: null };
  } catch (err) {
    const denied = err instanceof DOMException && (err.name === "NotAllowedError" || err.name === "SecurityError");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio });
      return {
        stream,
        problem: denied
          ? "Trình duyệt chưa cho dùng camera, nên cuộc gọi chỉ có tiếng."
          : "Không mở được camera (có thể ứng dụng khác đang dùng), nên cuộc gọi chỉ có tiếng.",
      };
    } catch {
      return {
        stream: new MediaStream(),
        problem: denied
          ? "Trình duyệt chưa cho dùng camera và micro. Bấm vào biểu tượng ổ khóa cạnh địa chỉ web, chọn Cho phép, rồi bấm Thử lại."
          : "Không tìm thấy camera hay micro. Em vẫn vào phòng được để xem và nghe bên kia.",
      };
    }
  }
}

const STATE_TEXT: Record<PeerState, string> = {
  cho: "Đang chờ {other} vào phòng…",
  "dang-noi": "Đang kết nối với {other}…",
  "da-noi": "Đã kết nối",
  "chap-chon": "Mạng chập chờn, đang nối lại…",
  loi: "Không kết nối được",
  roi: "{other} đã rời phòng. Em cứ chờ, khi {other} quay lại sẽ tự nối tiếp.",
};

function clock(ms: number) {
  return new Date(ms + 7 * 3600_000).toISOString().slice(11, 16);
}

export default function VideoCall(props: {
  id: string;
  role: Role;
  otherName: string;
  slot: string;
  closesAt: number;
  iceServers: IceServer[];
  hasTurn: boolean;
  back: string;
}) {
  const { id, role, otherName, slot, closesAt, iceServers, hasTurn, back } = props;
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const engineRef = useRef<CallEngine | null>(null);

  const [ready, setReady] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [state, setState] = useState<PeerState>("cho");
  const [closed, setClosed] = useState<Closed | null>(null);
  const [remote, setRemote] = useState<MediaStream | null>(null);
  const [remoteHasVideo, setRemoteHasVideo] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [slow, setSlow] = useState(false);

  async function openMedia() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    const { stream, problem } = await getMedia();
    streamRef.current = stream;
    setProblem(problem);
    setMicOn(stream.getAudioTracks().length > 0);
    setCamOn(stream.getVideoTracks().length > 0);
    if (localRef.current) localRef.current.srcObject = stream;
    setReady(true);
  }

  useEffect(() => {
    void openMedia();
    return () => {
      engineRef.current?.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    const bye = () => engineRef.current?.beaconBye();
    window.addEventListener("pagehide", bye);
    return () => window.removeEventListener("pagehide", bye);
  }, []);

  useEffect(() => {
    const v = remoteRef.current;
    if (!v) return;
    v.srcObject = remote;
    if (!remote) {
      setRemoteHasVideo(false);
      return;
    }
    // Kiểm tra mỗi giây xem bên kia có đang gửi hình không (tắt camera thì hiện khung chờ thay cho màn hình đen).
    const check = () => setRemoteHasVideo(remote.getVideoTracks().some((t) => t.readyState === "live" && !t.muted));
    check();
    const t = setInterval(check, 1000);
    void v.play().catch(() => {});
    return () => clearInterval(t);
  }, [remote]);

  // Chờ lâu mà chưa nối được: gợi ý đổi mạng.
  useEffect(() => {
    setSlow(false);
    if (state !== "dang-noi") return;
    const t = setTimeout(() => setSlow(true), 20_000);
    return () => clearTimeout(t);
  }, [state]);

  // Hết giờ thì đóng phòng ở cả trình duyệt.
  useEffect(() => {
    const ms = closesAt - Date.now();
    const t = setTimeout(() => {
      engineRef.current?.stop();
      engineRef.current = null;
      setClosed("het-gio");
    }, Math.max(0, Math.min(ms, 2 ** 31 - 1)));
    return () => clearTimeout(t);
  }, [closesAt]);

  function join() {
    if (!streamRef.current) return;
    setClosed(null);
    setState("cho");
    const engine = new CallEngine({
      id,
      role,
      ice: iceServers,
      stream: streamRef.current,
      onState: setState,
      onRemote: setRemote,
      onClosed: (reason) => {
        engineRef.current = null;
        setClosed(reason);
      },
    });
    engineRef.current = engine;
    setJoined(true);
    void engine.start();
  }

  function leave() {
    engineRef.current?.stop();
    engineRef.current = null;
    setJoined(false);
    setClosed("tu-roi");
  }

  function toggle(kind: "audio" | "video") {
    const tracks = kind === "audio" ? streamRef.current?.getAudioTracks() : streamRef.current?.getVideoTracks();
    if (!tracks?.length) return;
    const on = !tracks[0].enabled;
    tracks.forEach((t) => (t.enabled = on));
    if (kind === "audio") setMicOn(on);
    else setCamOn(on);
  }

  const hasMic = (streamRef.current?.getAudioTracks().length ?? 0) > 0;
  const hasCam = (streamRef.current?.getVideoTracks().length ?? 0) > 0;
  const fill = (s: string) => {
    const t = s.replaceAll("{other}", otherName);
    return t.charAt(0).toUpperCase() + t.slice(1);
  };
  const live = joined && !closed;
  const connected = live && state === "da-noi";

  return (
    <div className="call">
      <div className="call-head">
        <div>
          <h1>Phòng gọi video</h1>
          <p className="survey-muted">
            Buổi hẹn {slot} · phòng đóng lúc {clock(closesAt)}. Cuộc gọi không được ghi hình hay ghi âm.
          </p>
        </div>
        <Link href={back} className="link-button" onClick={() => engineRef.current?.stop()}>
          Quay lại lịch hẹn
        </Link>
      </div>

      <div className={`call-stage ${connected ? "is-live" : ""}`}>
        <video ref={remoteRef} className="call-remote" autoPlay playsInline hidden={!remote || !remoteHasVideo} />
        {!(connected && remoteHasVideo) && (
          <div className="call-placeholder" role="status" aria-live="polite">
            {closed === "het-gio" ? (
              <p>Đã hết giờ hẹn, phòng gọi đã đóng.</p>
            ) : closed === "khong-quyen" ? (
              <p>Phòng gọi đã đóng (lịch hẹn vừa được đổi trạng thái, hoặc em đã đăng xuất).</p>
            ) : closed === "tu-roi" ? (
              <p>Em đã rời phòng.</p>
            ) : !joined ? (
              <p>{ready ? "Kiểm tra camera và micro, rồi bấm Vào phòng." : "Đang mở camera và micro…"}</p>
            ) : connected ? (
              <p>Đã kết nối. {fill("{other} đang tắt camera hoặc chưa có hình.")}</p>
            ) : (
              <>
                <p>{fill(STATE_TEXT[state])}</p>
                {(state === "loi" || slow) && (
                  <p className="call-tip">
                    Mạng đang chặn kết nối (hay gặp ở wifi trường hoặc công ty). Em thử đổi sang 4G hoặc wifi khác rồi bấm
                    Vào lại.{!hasTurn && role === "cv" && " Nếu vẫn lỗi, hãy bật máy chủ TURN miễn phí theo hướng dẫn trong README."}
                  </p>
                )}
              </>
            )}
          </div>
        )}
        <video
          ref={localRef}
          className={`call-local ${camOn && hasCam ? "" : "is-off"}`}
          autoPlay
          playsInline
          muted
          aria-label="Hình của em"
        />
      </div>

      {problem && (
        <p className="call-problem" role="alert">
          {problem}{" "}
          {!live && (
            <button type="button" className="link-button" onClick={() => void openMedia()}>
              Thử lại
            </button>
          )}
        </p>
      )}

      <div className="call-controls">
        <button
          type="button"
          className={`call-btn ${micOn ? "" : "is-off"}`}
          onClick={() => toggle("audio")}
          disabled={!hasMic}
          aria-pressed={!micOn}
          aria-label={micOn ? "Tắt micro" : "Bật micro"}
          title={micOn ? "Tắt micro" : "Bật micro"}
        >
          {micOn ? <Mic size={22} aria-hidden="true" /> : <MicOff size={22} aria-hidden="true" />}
        </button>
        <button
          type="button"
          className={`call-btn ${camOn ? "" : "is-off"}`}
          onClick={() => toggle("video")}
          disabled={!hasCam}
          aria-pressed={!camOn}
          aria-label={camOn ? "Tắt camera" : "Bật camera"}
          title={camOn ? "Tắt camera" : "Bật camera"}
        >
          {camOn ? <Video size={22} aria-hidden="true" /> : <VideoOff size={22} aria-hidden="true" />}
        </button>
        {live ? (
          <button type="button" className="btn call-leave" onClick={leave}>
            <PhoneOff size={20} aria-hidden="true" /> Rời phòng
          </button>
        ) : closed === "het-gio" || closed === "khong-quyen" ? null : (
          <button type="button" className="btn btn-primary" onClick={join} disabled={!ready}>
            {closed ? <RefreshCw size={20} aria-hidden="true" /> : <Video size={20} aria-hidden="true" />}{" "}
            {closed ? "Vào lại" : "Vào phòng"}
          </button>
        )}
        {live && state === "loi" && (
          <button type="button" className="btn btn-outline" onClick={() => { leave(); join(); }}>
            <RefreshCw size={18} aria-hidden="true" /> Vào lại
          </button>
        )}
      </div>

      {role === "hs" && (
        <p className="survey-muted small">
          Nếu em đang gặp nguy hiểm hoặc cần giúp ngay mà chưa gọi được, hãy gọi 111 (miễn phí, 24/7).
        </p>
      )}
    </div>
  );
}
