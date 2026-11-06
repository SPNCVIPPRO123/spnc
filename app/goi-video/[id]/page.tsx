import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarClock, VideoOff } from "lucide-react";
import VideoCall from "@/components/VideoCall";
import CallCountdown from "@/components/CallCountdown";
import { hasDatabase } from "@/lib/db";
import { formatSlot } from "@/lib/booking";
import { callAccess } from "@/lib/callData";
import { hasTurn, iceServers } from "@/lib/iceServers";
import { callWindow, opensAtLabel } from "@/lib/videoCall";

export const dynamic = "force-dynamic";
export const metadata = { title: "Phòng gọi video", robots: { index: false, follow: false } };

function Notice({ title, children, back }: { title: string; children: React.ReactNode; back: string }) {
  return (
    <section className="section staff-section">
      <div className="container staff-shell survey-card call-notice">
        <h1>{title}</h1>
        {children}
        <p>
          <Link href={back} className="btn btn-outline btn-sm">
            Quay lại lịch hẹn
          </Link>
        </p>
      </div>
    </section>
  );
}

export default async function CallPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ vai?: string }>;
}) {
  const [{ id }, { vai }] = await Promise.all([params, searchParams]);
  const asStaff = vai === "cv";
  const back = asStaff ? "/chuyen-vien/lich-hen" : "/dat-lich";
  if (!hasDatabase()) {
    return (
      <Notice title="Phòng gọi video" back={back}>
        <p>Trang web chưa được kết nối cơ sở dữ liệu.</p>
      </Notice>
    );
  }

  const call = await callAccess(id, vai);
  if (call === "dang-nhap") {
    redirect(asStaff ? `/dang-nhap?vai=chuyen-vien&next=/goi-video/${id}` : `/dang-nhap?next=/goi-video/${id}`);
  }
  if (call === "khong-co") {
    return (
      <Notice title="Không tìm thấy phòng gọi" back={back}>
        <p>Có thể đường link bị sai, hoặc đây không phải lịch hẹn gọi video của em.</p>
      </Notice>
    );
  }
  if (call === "chua-xac-nhan") {
    return (
      <Notice title="Phòng gọi chưa mở" back={back}>
        <p>Phòng gọi chỉ mở khi chuyên viên đã xác nhận lịch hẹn. Lịch này có thể chưa được xác nhận, đã bị hủy hoặc buổi tư vấn đã xong rồi.</p>
      </Notice>
    );
  }

  const slot = formatSlot(call.startsAt);
  if (call.timing === "som") {
    return (
      <Notice title="Phòng gọi chưa đến giờ mở" back={back}>
        <p>
          <CalendarClock size={18} aria-hidden="true" className="inline-icon" /> Buổi hẹn: <strong>{slot}</strong>. Phòng mở
          lúc <strong>{opensAtLabel(call.startsAt)}</strong>.
        </p>
        <CallCountdown opensAt={callWindow(call.startsAt).opens} />
      </Notice>
    );
  }
  if (call.timing === "het") {
    return (
      <Notice title="Buổi hẹn đã kết thúc" back={back}>
        <p>
          <VideoOff size={18} aria-hidden="true" className="inline-icon" /> Phòng gọi của buổi {slot} đã đóng.
        </p>
      </Notice>
    );
  }

  const other = call.role === "hs" ? "chuyên viên" : call.nickname ? `“${call.nickname}”` : "học sinh";
  return (
    <section className="section staff-section">
      <div className="container call-shell">
        <VideoCall
          id={call.id}
          role={call.role}
          otherName={other}
          slot={slot}
          closesAt={callWindow(call.startsAt).closes}
          iceServers={await iceServers()}
          hasTurn={hasTurn()}
          back={back}
        />
      </div>
    </section>
  );
}
