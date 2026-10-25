// Bộ câu hỏi "Phiếu khảo sát cảm xúc và nhu cầu hỗ trợ tâm lý của học sinh" (bản thử nghiệm).
// Câu chữ giữ nguyên theo phiếu giấy; mã câu (A1, E1.1, B1…) trùng với mã trên phiếu để tiện đối chiếu.
// Muốn sửa câu hỏi: sửa trực tiếp nội dung trong danh sách SECTIONS bên dưới.

export type Answer = string | number | string[];
export type Answers = Record<string, Answer>;

type Option = { value: string | number; label: string; short?: string };

export const SCALES = {
  // Phần 2
  agree5: [
    { value: 1, label: "Hoàn toàn không đồng ý", short: "Hoàn toàn không đồng ý" },
    { value: 2, label: "Không đồng ý", short: "Không đồng ý" },
    { value: 3, label: "Phân vân", short: "Phân vân" },
    { value: 4, label: "Đồng ý", short: "Đồng ý" },
    { value: 5, label: "Hoàn toàn đồng ý", short: "Hoàn toàn đồng ý" },
  ],
  // Phần 3 – DASS-21
  dass4: [
    { value: 0, label: "Không đúng với tôi chút nào", short: "Không đúng" },
    { value: 1, label: "Đúng phần nào, hoặc thỉnh thoảng", short: "Thỉnh thoảng" },
    { value: 2, label: "Đúng phần nhiều, hoặc khá thường xuyên", short: "Khá thường xuyên" },
    { value: 3, label: "Hoàn toàn đúng, hoặc hầu hết thời gian", short: "Hầu hết thời gian" },
  ],
  // Phần 4 – 7, 9
  freq5: [
    { value: 1, label: "Không bao giờ", short: "Không bao giờ" },
    { value: 2, label: "Hiếm khi", short: "Hiếm khi" },
    { value: 3, label: "Thỉnh thoảng", short: "Thỉnh thoảng" },
    { value: 4, label: "Thường xuyên", short: "Thường xuyên" },
    { value: 5, label: "Rất thường xuyên", short: "Rất thường xuyên" },
  ],
  yesno: [
    { value: 1, label: "Có" },
    { value: 0, label: "Không" },
  ],
  // Phần 8: "Không muốn trả lời" = 9 và được tính như câu trả lời "Có" (theo ghi chú của phiếu).
  safety: [
    { value: 1, label: "Có" },
    { value: 0, label: "Không" },
    { value: 9, label: "Không muốn trả lời" },
  ],
} satisfies Record<string, Option[]>;

export type ScaleId = keyof typeof SCALES;

export type Question =
  | { id: string; text: string; kind: "choice"; options: string[]; showIf?: (a: Answers) => boolean }
  | { id: string; text: string; kind: "scale"; scale: ScaleId; showIf?: (a: Answers) => boolean }
  | { id: string; text: string; kind: "multi"; options: string[]; otherLabel?: string; showIf?: (a: Answers) => boolean };

export type Section = {
  id: string;
  title: string;
  intro?: string;
  scale?: ScaleId; // thang chung của cả phần, hiện chú thích ở đầu phần
  groups: { heading?: string; scale?: ScaleId; questions: Question[] }[];
  note?: string;
};

const scaleQs = (scale: ScaleId, items: [string, string][]): Question[] =>
  items.map(([id, text]) => ({ id, text, kind: "scale", scale }));

const num = (a: Answers, id: string) => (typeof a[id] === "number" ? (a[id] as number) : null);

export const SAFETY_IDS = ["C1", "C2", "C3", "C4"];
const BULLYING_IDS = ["D3.5", "D3.6", "D3.7", "D3.8", "D3.9", "D3.10"];

export const SECTIONS: Section[] = [
  {
    id: "p1",
    title: "Thông tin chung",
    groups: [
      {
        questions: [
          { id: "A1", text: "Em đang học lớp mấy?", kind: "choice", options: ["10", "11", "12"] },
          { id: "A2", text: "Giới tính của em", kind: "choice", options: ["Nam", "Nữ", "Khác", "Không muốn trả lời"] },
          {
            id: "A3",
            text: "Hiện em đang sống cùng ai?",
            kind: "choice",
            options: ["Cả bố và mẹ", "Chỉ bố hoặc chỉ mẹ", "Ông bà hoặc người thân", "Ở trọ, ký túc xá", "Khác"],
          },
          { id: "A4", text: "Em là con thứ mấy trong gia đình?", kind: "choice", options: ["Con một", "Con cả", "Con giữa", "Con út"] },
          {
            id: "A5",
            text: "Kết quả học tập học kỳ gần nhất của em",
            kind: "choice",
            options: ["Tốt", "Khá", "Đạt", "Chưa đạt", "Không muốn trả lời"],
          },
          {
            id: "A6",
            text: "Em muốn làm phiếu theo cách nào?",
            kind: "choice",
            options: ["Ẩn danh hoàn toàn", "Để lại cách liên lạc ở cuối phiếu để chuyên viên hỗ trợ khi cần"],
          },
        ],
      },
    ],
  },
  {
    id: "p2",
    title: "Suy nghĩ của em về việc tìm trợ giúp",
    intro: "Em đồng ý với mỗi ý dưới đây đến mức nào? Chọn một ô ở mỗi dòng.",
    scale: "agree5",
    groups: [
      {
        questions: scaleQs("agree5", [
          ["E1.1", "Em phân biệt được cảm giác buồn thông thường với dấu hiệu cần được hỗ trợ tâm lý."],
          ["E1.2", "Em biết trường có phòng hoặc chuyên viên tư vấn tâm lý."],
          ["E1.3", "Em biết cách liên hệ với chuyên viên tư vấn của trường."],
          ["E1.4", "Em biết Tổng đài quốc gia bảo vệ trẻ em 111."],
          ["E1.5", "Em nghĩ gặp chuyên viên tâm lý là chuyện bình thường, không có nghĩa là \"có vấn đề\"."],
          ["E2.1", "Em ngại tìm hỗ trợ vì sợ bạn bè biết."],
          ["E2.2", "Em ngại vì sợ thầy cô hoặc bố mẹ biết."],
          ["E2.3", "Em không chắc chuyên viên sẽ giữ bí mật cho em."],
          ["E2.4", "Em nghĩ mình nên tự giải quyết, không cần nhờ ai."],
          ["E2.5", "Em nghĩ vấn đề của mình chưa đủ nghiêm trọng để cần hỗ trợ."],
          ["E2.6", "Em thấy xấu hổ khi nói về cảm xúc của mình."],
          ["E2.7", "Em không biết bắt đầu câu chuyện với người tư vấn như thế nào."],
          ["E3.1", "Em sẽ chia sẻ thật hơn nếu được giấu tên."],
          ["E3.2", "Em thấy nhắn tin dễ nói hơn gặp mặt trực tiếp."],
          ["E3.3", "Em muốn được tự chọn giữa ẩn danh và để lại tên."],
          ["E3.4", "Em muốn có tài khoản riêng để xem lại kết quả và lịch sử trò chuyện."],
          ["E3.5", "Em đồng ý để chuyên viên xem kết quả khảo sát nếu điều đó giúp em được hỗ trợ sớm hơn."],
          ["E4.1", "Khi gặp khó khăn tâm lý, em sẽ tìm đến chuyên viên tư vấn của trường."],
          ["E4.2", "Em sẵn sàng làm khảo sát nhanh trên website để hiểu tình trạng của mình."],
          ["E4.3", "Em sẽ giới thiệu website cho bạn bè đang gặp khó khăn."],
        ]),
      },
      {
        questions: [
          {
            id: "E3.6",
            text: "Em muốn được tư vấn qua (chọn nhiều)",
            kind: "multi",
            options: ["Nhắn tin trên website", "Gọi thoại", "Gọi video", "Email", "Gặp trực tiếp"],
          },
          {
            id: "E3.7",
            text: "Em muốn được hỗ trợ vào lúc (chọn nhiều)",
            kind: "multi",
            options: ["Giờ ra chơi, giờ hành chính", "Buổi tối", "Cuối tuần", "Bất cứ khi nào cần"],
          },
          {
            id: "E5",
            text: "Em muốn được tư vấn về (chọn nhiều)",
            kind: "multi",
            options: [
              "Học tập, phương pháp học",
              "Hướng nghiệp",
              "Cảm xúc (buồn, lo âu, căng thẳng)",
              "Quan hệ gia đình",
              "Quan hệ bạn bè",
              "Quan hệ thầy cô",
              "Tình cảm, giới tính",
              "Kỹ năng sống",
            ],
            otherLabel: "Khác",
          },
        ],
      },
    ],
  },
  {
    id: "p3",
    title: "Cảm xúc của em trong 7 ngày qua",
    intro:
      "Hãy đọc từng câu và chọn 0, 1, 2 hoặc 3 cho biết câu đó đúng với em đến mức nào trong 7 ngày qua. Không có câu trả lời đúng hay sai. Đừng dừng quá lâu ở một câu.",
    scale: "dass4",
    note: "Phần này dùng thang DASS-21 (Lovibond & Lovibond, 1995).",
    groups: [
      {
        questions: scaleQs("dass4", [
          ["B1", "Tôi thấy khó bình tâm lại."],
          ["B2", "Tôi thấy miệng mình bị khô."],
          ["B3", "Tôi dường như không cảm nhận được chút cảm xúc tích cực nào."],
          ["B4", "Tôi bị khó thở (ví dụ thở quá nhanh, hụt hơi dù không gắng sức)."],
          ["B5", "Tôi thấy khó bắt tay vào làm việc gì đó."],
          ["B6", "Tôi có xu hướng phản ứng thái quá với các tình huống."],
          ["B7", "Tôi bị run (ví dụ run tay)."],
          ["B8", "Tôi cảm thấy mình tiêu hao nhiều năng lượng vì bồn chồn, căng thẳng."],
          ["B9", "Tôi lo về những tình huống mà mình có thể hoảng loạn và bị bẽ mặt."],
          ["B10", "Tôi cảm thấy không còn gì để mong đợi."],
          ["B11", "Tôi thấy mình dễ bị kích động, bứt rứt."],
          ["B12", "Tôi thấy khó thư giãn."],
          ["B13", "Tôi cảm thấy chán nản, buồn bã."],
          ["B14", "Tôi không chịu được bất cứ điều gì cản trở việc mình đang làm."],
          ["B15", "Tôi cảm thấy mình gần như sắp hoảng loạn."],
          ["B16", "Tôi không thể hào hứng với bất cứ điều gì."],
          ["B17", "Tôi cảm thấy bản thân không có nhiều giá trị."],
          ["B18", "Tôi thấy mình khá dễ phật ý, dễ cáu."],
          ["B19", "Tôi cảm nhận rõ tim mình đập dù không vận động (ví dụ tim đập nhanh, hụt nhịp)."],
          ["B20", "Tôi cảm thấy sợ hãi mà không có lý do chính đáng."],
          ["B21", "Tôi cảm thấy cuộc sống vô nghĩa."],
        ]),
      },
    ],
  },
  {
    id: "p4",
    title: "Việc học và trường lớp",
    intro: "Trong khoảng 1 tháng qua, mỗi điều dưới đây xảy ra với em thường xuyên đến mức nào?",
    scale: "freq5",
    groups: [
      {
        questions: scaleQs("freq5", [
          ["D1.1", "Em thấy khó tập trung khi học trên lớp."],
          ["D1.2", "Em thấy khó theo kịp bài giảng ở một số môn."],
          ["D1.3", "Em băn khoăn chưa biết nên chọn ngành nghề nào."],
          ["D1.4", "Bài tập và lịch học thêm nhiều đến mức em không còn thời gian nghỉ ngơi."],
          ["D1.5", "Việc học khiến em phải thức khuya, thiếu ngủ."],
          ["D1.6", "Em lo lắng trước các bài kiểm tra vì sợ bị điểm thấp."],
          ["D1.7", "Em căng thẳng khi nghĩ đến các kỳ thi lớn (tốt nghiệp, xét tuyển đại học)."],
          ["D1.8", "Em thấy áp lực vì phải cạnh tranh điểm số với bạn bè."],
          ["D1.9", "Em thất vọng về bản thân khi kết quả học tập không như mong muốn."],
          ["D1.10", "Em cảm thấy dù cố gắng thế nào cũng không học tốt được."],
          ["D2.1", "Em ngại hỏi thầy cô khi chưa hiểu bài."],
          ["D2.2", "Em cảm thấy thầy cô không hiểu hoặc chưa công bằng với em."],
          ["D2.3", "Em bị so sánh với bạn khác trước lớp."],
          ["D2.4", "Em cảm thấy mình không thuộc về lớp hoặc trường này."],
          ["D2.5", "Em cảm thấy không an toàn khi ở trường."],
          ["D2.6", "Em bị thầy cô phê bình nặng nề hoặc làm bẽ mặt trước lớp."],
          ["D2.7", "Em bị phạt theo cách gây đau hoặc xúc phạm (đánh, bắt đứng lâu, mắng chửi)."],
        ]),
      },
    ],
  },
  {
    id: "p5",
    title: "Bạn bè",
    intro: "Trong khoảng 1 tháng qua, mỗi điều dưới đây xảy ra với em thường xuyên đến mức nào?",
    scale: "freq5",
    groups: [
      {
        questions: [
          ...scaleQs("freq5", [
            ["D3.1", "Em cảm thấy lạc lõng, khó hòa nhập với các bạn trong lớp."],
            ["D3.2", "Em có mâu thuẫn, xích mích với bạn bè."],
            ["D3.3", "Em thấy áp lực phải giống bạn bè (đồ dùng, ngoại hình, trào lưu)."],
            ["D3.4", "Chuyện tình cảm tuổi học trò khiến em buồn phiền, mất tập trung."],
            ["D3.5", "Em bị bạn trêu chọc, chế giễu về ngoại hình, gia cảnh, giọng nói hoặc giới tính."],
            ["D3.6", "Em bị các bạn cố ý tẩy chay, không cho tham gia nhóm."],
            ["D3.7", "Em bị nói xấu hoặc bị tung tin đồn về mình."],
            ["D3.8", "Em bị bêu riếu, đe dọa hoặc nhắn tin xúc phạm trên mạng xã hội."],
            ["D3.9", "Em bị bạn ép làm điều em không muốn (đưa tiền, làm bài hộ, thử thuốc lá điện tử…)."],
            ["D3.10", "Em bị bạn đánh, xô đẩy, lấy hoặc làm hỏng đồ."],
          ]),
          {
            id: "D3.11",
            text: "Những chuyện em vừa kể (bị trêu chọc, tẩy chay, nói xấu, đe dọa, ép buộc, đánh…) thường xảy ra ở đâu? (chọn nhiều)",
            kind: "multi",
            options: ["Trong lớp", "Sân trường, nhà vệ sinh", "Trên đường đi học", "Trên mạng xã hội"],
            otherLabel: "Nơi khác",
            showIf: (a) => BULLYING_IDS.some((id) => (num(a, id) ?? 0) >= 2),
          },
        ],
      },
    ],
  },
  {
    id: "p6",
    title: "Gia đình và người thân",
    intro:
      "\"Bố mẹ\" ở đây gồm cả người đang nuôi dưỡng em. Trong khoảng 1 tháng qua, mỗi điều dưới đây xảy ra với em thường xuyên đến mức nào?",
    scale: "freq5",
    groups: [
      {
        questions: scaleQs("freq5", [
          ["D4.1", "Bố mẹ ít có thời gian trò chuyện với em."],
          ["D4.2", "Em thấy khó nói với bố mẹ những điều mình nghĩ."],
          ["D4.3", "Bố mẹ kỳ vọng quá cao về điểm số, trường lớp hoặc ngành học của em."],
          ["D4.4", "Em bị so sánh với anh chị em, họ hàng hoặc \"con nhà người ta\"."],
          ["D4.5", "Ông bà, họ hàng chê trách hoặc góp ý khiến em áp lực."],
          ["D4.6", "Bố mẹ kiểm soát quá chặt (điện thoại, bạn bè, giờ giấc) khiến em ngột ngạt."],
          ["D4.7", "Em phải lo nhiều việc nhà hoặc chăm người thân đến mức ảnh hưởng việc học."],
          ["D4.8", "Khó khăn kinh tế của gia đình khiến em lo lắng."],
          ["D4.9", "Người thân trong nhà ốm đau hoặc buồn bã kéo dài khiến em lo lắng."],
          ["D4.10", "Bố mẹ hoặc người lớn trong nhà cãi vã, xung đột trước mặt em."],
          ["D4.11", "Khi bố mẹ mệt mỏi hoặc bực bội, em trở thành người bị trút giận."],
          ["D4.12", "Em bị người trong gia đình mắng chửi, xúc phạm nặng nề."],
          ["D4.13", "Em bị người trong gia đình đánh hoặc phạt gây đau."],
        ]),
      },
    ],
  },
  {
    id: "p7",
    title: "Cuộc sống xung quanh em",
    intro: "Trong khoảng 1 tháng qua, mỗi điều dưới đây xảy ra với em thường xuyên đến mức nào?",
    scale: "freq5",
    groups: [
      {
        questions: scaleQs("freq5", [
          ["D5.1", "Em dùng điện thoại, mạng xã hội đến mức ảnh hưởng giấc ngủ hoặc việc học."],
          ["D5.2", "Em so sánh bản thân với người khác trên mạng và thấy mình kém cỏi."],
          ["D5.3", "Em gặp nội dung tiêu cực, bạo lực hoặc gây sợ hãi trên mạng."],
          ["D5.4", "Nơi em sống ồn ào, chật chội, khó có chỗ yên tĩnh để học."],
          ["D5.5", "Em cảm thấy không an toàn ở khu vực mình sống."],
          ["D5.6", "Em bị rủ rê hút thuốc lá điện tử, uống rượu bia hoặc dùng chất kích thích."],
          ["D5.7", "Người lạ trên mạng làm quen rồi dụ dỗ, đòi hỏi hoặc lừa em."],
          ["D5.8", "Có người đụng chạm cơ thể hoặc có lời nói, hành vi khiến em sợ hãi, khó chịu (trong hay ngoài gia đình)."],
        ]),
      },
      {
        heading: "Trong 12 tháng qua, em có trải qua điều nào dưới đây không?",
        scale: "yesno",
        questions: scaleQs("yesno", [
          ["D5b.1", "Chuyển nhà hoặc chuyển trường"],
          ["D5b.2", "Bố mẹ ly thân hoặc ly hôn"],
          ["D5b.3", "Người thân qua đời hoặc mắc bệnh nặng"],
          ["D5b.4", "Gia đình gặp khó khăn tài chính lớn (mất việc, nợ nần)"],
          ["D5b.5", "Trải qua hoặc chứng kiến tai nạn, thiên tai, sự việc gây sốc"],
          ["D5b.6", "Chia tay người yêu hoặc mất một tình bạn quan trọng"],
          ["D5b.7", "Bị kỷ luật ở trường"],
          ["D5b.8", "Biến cố khác"],
        ]),
      },
    ],
  },
  {
    id: "p8",
    title: "Câu hỏi về sự an toàn của em",
    intro:
      "Những câu tiếp theo hỏi về những suy nghĩ rất nặng nề mà đôi khi ai cũng có thể gặp. Em hãy trả lời thật lòng.",
    groups: [
      {
        questions: [
          ...scaleQs("safety", [
            ["C1", "Trong vài tuần qua, em có từng ước rằng mình chết đi không?"],
            ["C2", "Trong vài tuần qua, em có cảm thấy em hoặc gia đình sẽ tốt hơn nếu em chết đi không?"],
            ["C3", "Trong tuần qua, em có nghĩ đến việc tự tử không?"],
            ["C4", "Em đã bao giờ cố tự tử chưa?"],
          ]),
          {
            id: "C5",
            text: "Ngay lúc này, em có đang nghĩ đến việc tự tử không?",
            kind: "scale",
            scale: "yesno",
            showIf: (a) => SAFETY_IDS.some((id) => a[id] === 1 || a[id] === 9),
          },
        ],
      },
    ],
  },
  {
    id: "p9",
    title: "Những điểm tựa của em",
    intro: "Trong khoảng 1 tháng qua, mỗi điều dưới đây đúng với em thường xuyên đến mức nào?",
    scale: "freq5",
    groups: [
      {
        questions: scaleQs("freq5", [
          ["D6.1", "Khi buồn hoặc gặp chuyện, em có người trong gia đình để chia sẻ."],
          ["D6.2", "Gia đình động viên và tin tưởng em."],
          ["D6.3", "Em có ít nhất một người bạn tin cậy để tâm sự."],
          ["D6.4", "Bạn bè giúp đỡ khi em gặp khó khăn."],
          ["D6.5", "Ở trường có ít nhất một thầy cô hoặc người lớn mà em tin tưởng."],
          ["D6.6", "Em cảm thấy được lắng nghe khi nói ra suy nghĩ của mình."],
          ["D6.7", "Em có hoạt động giúp mình thư giãn (thể thao, âm nhạc, sở thích…)."],
          ["D6.8", "Em biết mình có thể tìm sự giúp đỡ ở đâu khi gặp khó khăn."],
        ]),
      },
    ],
  },
];

// ---------- Kiểm tra câu trả lời ----------

export function visibleQuestions(section: Section, answers: Answers): Question[] {
  return section.groups.flatMap((g) => g.questions).filter((q) => !q.showIf || q.showIf(answers));
}

// Xóa câu trả lời của các câu điều kiện đang bị ẩn (ví dụ C5 khi C1–C4 đều "Không"),
// để câu trả lời cũ không còn nằm lại trong phiếu.
export function dropHiddenAnswers(answers: Answers): Answers {
  let next = answers;
  for (const s of SECTIONS)
    for (const g of s.groups)
      for (const q of g.questions) {
        if (!q.showIf || q.showIf(next)) continue;
        for (const id of [q.id, `${q.id}_khac`]) {
          if (next[id] === undefined) continue;
          if (next === answers) next = { ...answers };
          delete next[id];
        }
      }
  return next;
}

// Câu chọn một đáp án là bắt buộc; câu chọn nhiều thì không bắt buộc.
export function missingQuestions(section: Section, answers: Answers): string[] {
  return visibleQuestions(section, answers)
    .filter((q) => q.kind !== "multi" && answers[q.id] === undefined)
    .map((q) => q.id);
}

// ---------- Chấm điểm ----------

// DASS-21: điểm mỗi tiểu thang = tổng 7 câu × 2. Ngưỡng theo Lovibond & Lovibond (1995).
const DASS = {
  depression: { items: [3, 5, 10, 13, 16, 17, 21], cutoffs: [10, 14, 21, 28] },
  anxiety: { items: [2, 4, 7, 9, 15, 19, 20], cutoffs: [8, 10, 15, 20] },
  stress: { items: [1, 6, 8, 11, 12, 14, 18], cutoffs: [15, 19, 26, 34] },
} as const;

export type DassKey = keyof typeof DASS;

export const DASS_INFO: Record<DassKey, { name: string; desc: string }> = {
  depression: { name: "Buồn chán, mất hứng thú", desc: "cảm giác buồn bã, thiếu năng lượng, khó tìm thấy niềm vui" },
  anxiety: { name: "Lo âu", desc: "cảm giác lo lắng, hồi hộp, sợ hãi và các phản ứng của cơ thể" },
  stress: { name: "Căng thẳng", desc: "cảm giác căng thẳng, khó thư giãn, dễ cáu gắt" },
};

// 0 = ổn định … 4 = rất cao. Dùng từ ngữ nhẹ nhàng, không dán nhãn bệnh.
export const LEVEL_LABELS = ["Ổn định", "Hơi cao", "Khá cao", "Cao", "Rất cao"];

export type DassResult = Record<DassKey, { score: number; level: number }>;

export function scoreDass(answers: Answers): DassResult {
  const result = {} as DassResult;
  for (const key of Object.keys(DASS) as DassKey[]) {
    const { items, cutoffs } = DASS[key];
    const score = items.reduce((sum, n) => sum + (num(answers, `B${n}`) ?? 0), 0) * 2;
    const level = cutoffs.filter((c) => score >= c).length;
    result[key] = { score, level };
  }
  return result;
}

// Phần 8: có ít nhất một câu "Có" hoặc "Không muốn trả lời".
// declinedOnly: không có câu "Có", chỉ có câu "Không muốn trả lời".
export function safetyConcern(answers: Answers): { flagged: boolean; urgent: boolean; declinedOnly: boolean } {
  const saidYes = SAFETY_IDS.some((id) => answers[id] === 1);
  const flagged = saidYes || SAFETY_IDS.some((id) => answers[id] === 9);
  return { flagged, urgent: flagged && answers["C5"] === 1, declinedOnly: flagged && !saidYes };
}

// Các câu về bạo lực, xâm hại (theo danh sách câu nhạy cảm trong ghi chú của phiếu).
const PROTECTION_IDS = ["D2.7", "D3.8", "D3.9", "D3.10", "D4.12", "D4.13", "D5.7", "D5.8"];

export function protectionConcern(answers: Answers): boolean {
  return PROTECTION_IDS.some((id) => (num(answers, id) ?? 0) >= 2);
}

const AREAS: { name: string; ids: RegExp }[] = [
  { name: "Việc học", ids: /^D1\./ },
  { name: "Thầy cô và trường lớp", ids: /^D2\./ },
  { name: "Bạn bè", ids: /^D3\.([1-9]|10)$/ },
  { name: "Gia đình", ids: /^D4\./ },
  { name: "Cuộc sống xung quanh", ids: /^D5\.\d$/ },
];

function questionText(id: string): string {
  for (const s of SECTIONS) for (const g of s.groups) for (const q of g.questions) if (q.id === id) return q.text;
  return id;
}

// Những điều xảy ra "Thường xuyên" hoặc "Rất thường xuyên", nhóm theo lĩnh vực.
export function worries(answers: Answers): { area: string; items: string[] }[] {
  return AREAS.map(({ name, ids }) => ({
    area: name,
    items: Object.keys(answers)
      .filter((id) => ids.test(id) && (num(answers, id) ?? 0) >= 4)
      .sort((a, b) => (num(answers, b) ?? 0) - (num(answers, a) ?? 0))
      .map(questionText),
  })).filter((w) => w.items.length > 0);
}

// Những điểm tựa (Phần 9) mà học sinh trả lời "Thường xuyên" trở lên.
export function strengths(answers: Answers): string[] {
  return Object.keys(answers)
    .filter((id) => /^D6\./.test(id) && (num(answers, id) ?? 0) >= 4)
    .map(questionText);
}

export function lifeEvents(answers: Answers): string[] {
  return Object.keys(answers)
    .filter((id) => /^D5b\./.test(id) && answers[id] === 1)
    .map(questionText);
}
