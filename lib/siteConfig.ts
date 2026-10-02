// Thông tin của trường — hãy sửa các giá trị dưới đây cho đúng với trường của bạn.
// Chatbot sẽ dùng chính các thông tin này khi trả lời học sinh.
export const siteConfig = {
  siteName: "Bạn Đồng Hành",
  schoolName: "Trường THCS – THPT ABC",
  botName: "Bạn Đồng Hành",

  // Cách liên hệ phòng tham vấn tâm lý của trường (hiển thị cho học sinh).
  counselingRoom: "Phòng Tham vấn tâm lý – tầng 2, nhà A (giờ hành chính các ngày trong tuần)",

  // Đường dẫn tới các chức năng khác của web. Khi làm xong trang nào thì đổi đường dẫn ở đây.
  surveyPath: "/khao-sat",
  counselingPath: "/tham-van",

  // Số điện thoại khẩn cấp (miễn phí, 24/7).
  hotlines: [
    { number: "111", label: "Tổng đài quốc gia bảo vệ trẻ em (miễn phí, 24/7)" },
    { number: "115", label: "Cấp cứu y tế" },
    { number: "113", label: "Công an" },
  ],
} as const;
