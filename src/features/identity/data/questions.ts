import { IIdentityQuestion } from '../types';

export const IDENTITY_QUESTIONS: IIdentityQuestion[] = [
  // --- CHẶNG 1: SOI CHIẾU BÓNG TỐI (AXIT) ---
  {
    id: 1,
    stage: 1,
    content: "Nỗi bất mãn âm ỉ và dai dẳng mà bạn đang phải sống chung hàng ngày là gì?",
  },
  {
    id: 2,
    stage: 1,
    content: "Viết ra 3 điều về bản thân bạn thường xuyên phàn nàn nhưng vẫn chưa thay đổi được?",
  },
  {
    id: 3,
    stage: 1,
    content: "Với mỗi lời phàn nàn, hãy lắng nghe như người ngoài cuộc: Điều bạn thực sự khao khát ẩn dưới sự khó chịu đó là gì?",
  },
  {
    id: 4,
    stage: 1,
    content: "Đâu là sự thật về cuộc sống của bạn mà bạn không bao giờ dám thổ lộ với người mình vô cùng kính trọng?",
  },
  {
    id: 5,
    stage: 1,
    content: "Giữa những bất mãn đó, phẩm chất nào của bạn vẫn đang 'sống sót' và lấp lánh? Điều gì ở bản thân mà bạn nhất quyết không để nó bị tha hóa?",
    helperText: "Sau câu này, bạn sẽ cần nghỉ ngơi 15 phút."
  },

  // --- CHẶNG 2: VIỄN CẢNH KHỐC LIỆT (AXIT ĐẬM ĐẶC) ---
  {
    id: 6,
    stage: 2,
    content: "Nếu hành vi không đổi trong 5 năm tới, hãy mô tả một ngày thứ Ba bình thường: Bạn thức dậy ở đâu? Cơ thể cảm thấy thế nào? Ai đang rời bỏ bạn?",
  },
  {
    id: 7,
    stage: 2,
    content: "Nhìn ở mốc 10 năm: Bạn đã bỏ lỡ những cơ hội nào? Mọi người nói gì về bạn khi bạn không có mặt ở đó?",
  },
  {
    id: 8,
    stage: 2,
    content: "Bạn đang ở cuối đời, sống một cuộc đời 'an toàn' và chưa bao giờ phá vỡ khuôn mẫu. Cái giá bạn phải trả là gì? Bạn đã không cho phép mình trở thành điều gì?",
  },
  {
    id: 9,
    stage: 2,
    content: "Bạn thấy ai đang sống cuộc sống giống với tương lai (tệ hại) mà bạn vừa mô tả? Bạn cảm thấy thế nào khi nghĩ về việc trở thành họ?",
  },

  // --- CHẶNG 3: KHOẢNG LẶNG VÀ SỰ TRUNG THÀNH ---
  {
    id: 10,
    stage: 3,
    content: "Mỏ neo liêm chính: Đâu là những giới hạn đạo đức và giá trị (gia đình, lòng tự trọng) mà bạn đã thành công trong việc bảo vệ cho đến ngày hôm nay?",
  },
  {
    id: 11,
    stage: 3,
    content: "Để không trở thành con người ở câu 9, bạn phải từ bỏ căn tính cũ nào? Việc 'khai tử' con người cũ gây ra tổn thất gì về xã hội cho bạn?",
  },
  {
    id: 12,
    stage: 3,
    content: "Sự thật tàn nhẫn: Bạn đang 'trung thành' với một lời hứa hay một kỳ vọng lỗi thời nào trong quá khứ? Bạn sẵn sàng chấm dứt sự trung thành đó chứ?",
  },
  {
    id: 13,
    stage: 3,
    content: "Lý do nào khiến bạn chưa thay đổi mà nghe có vẻ yếu đuối, sợ hãi hoặc lười biếng nhất? Hãy gọi tên sự xấu hổ đó.",
  },
  {
    id: 14,
    stage: 3,
    content: "Nếu hành vi hiện tại là một hình thức tự bảo vệ, thì bạn đang bảo vệ cái gì? (Cái tôi, sự lười biếng, hay nỗi sợ bị phán xét?)",
  },

  // --- CHẶNG 4: KIẾN TẠO TẦM NHÌN (ÁNH SÁNG) ---
  {
    id: 15,
    stage: 4,
    content: "Giả sử bạn búng tay và sống một cuộc đời mơ ước sau 3 năm. Một ngày thứ Ba bình thường trông như thế nào?",
  },
  {
    id: 16,
    stage: 4,
    content: "Bạn cần tin điều gì về mình để cuộc sống này trở nên tự nhiên? Hãy viết bản tuyên ngôn: 'Tôi là kiểu người...'",
  },
  {
    id: 17,
    stage: 4,
    content: "Nếu đã là người đó rồi, điều bạn mong muốn làm nhất trong tuần này là gì?",
  },
  {
    id: 18,
    stage: 4,
    content: "Đâu là 'kẻ thù thực sự' của bạn? (Một niềm tin cũ, một thói quen độc hại).",
  },

  // --- CHẶNG 5: CHIẾN LƯỢC VÀ LẬP LỆNH THỰC THI (TẠO ĐÀ) ---
  {
    id: 19,
    stage: 5,
    content: "Viết một câu tóm gọn về cuộc sống bạn ghê sợ.",
  },
  {
    id: 20,
    stage: 5,
    content: "Viết một câu tóm gọn về cuộc sống bạn hướng tới (Tầm nhìn).",
  },
  {
    id: 21,
    stage: 5,
    content: "Tuyên ngôn Giới hạn (Luật chơi): Bạn tuyên bố không bao giờ hy sinh giá trị cốt lõi nào để đạt được tầm nhìn trên?",
  },
  {
    id: 22,
    stage: 5,
    content: "Khẳng định Căn tính: Để hiện thực hóa tầm nhìn trên, bạn chọn trở thành người như thế nào? (Vd: 'Tôi là kiểu người... ')",
  },
  {
    id: 23,
    stage: 5,
    content: "Phân tích khoảng cách (Gap Analysis): Đâu là 3 kỹ năng hoặc thói quen bạn buộc phải làm chủ trong 12 tháng tới?",
  },
  {
    id: 24,
    stage: 5,
    content: "Cột mốc cụ thể của 30 ngày tiếp theo là gì?",
  },
  {
    id: 25,
    stage: 5,
    content: "Kế hoạch 2-3 việc cho ngày mai?",
  },
];