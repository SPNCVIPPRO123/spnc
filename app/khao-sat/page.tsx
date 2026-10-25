import { ClipboardList } from "lucide-react";
import Survey from "@/components/Survey";

export const metadata = { title: "Khảo sát nhanh" };

export default function SurveyPage() {
  return (
    <>
      <section className="page-hero tone-sun survey-hero">
        <div className="container">
          <span className="page-hero-icon">
            <ClipboardList size={32} aria-hidden="true" />
          </span>
          <h1>Khảo sát nhanh</h1>
          <p className="lead">
            Đôi khi mình không rõ vì sao mình thấy mệt, thấy buồn. Bài khảo sát này giúp bạn dừng lại một chút và lắng
            nghe chính mình.
          </p>
        </div>
      </section>

      <section className="section survey-section">
        <div className="container">
          <Survey />
        </div>
      </section>
    </>
  );
}
