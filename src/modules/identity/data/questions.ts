// src/modules/identity/data/questions.ts

export interface IdentityQuestion {
    id: number;
    phase: number; // 1 to 5
    text: string;
    isManifesto?: boolean; // Các câu dùng cho Tuyên ngôn (20-24)
  }
  
  export const IDENTITY_QUESTIONS: IdentityQuestion[] = [
    // --- CHẶNG 1: SOI CHIẾU BÓNG TỐI (AXIT) ---
    { id: 1, phase: 1, text: "Nỗi bất mãn âm ỉ và dai dẳng mà **bạn** đang phải sống chung hàng ngày là gì?" },
    { id: 2, phase: 1, text: "Viết ra 3 điều về bản thân **bạn** thường xuyên phàn nàn nhưng vẫn chưa thay đổi được?" },
    { id: 3, phase: 1, text: "Với mỗi lời phàn nàn, hãy lắng nghe như người ngoài cuộc: Điều **bạn** thực sự khao khát ẩn dưới sự khó chịu đó là gì?" },
    { id: 4, phase: 1, text: "Đâu là sự thật về cuộc sống của **bạn** mà **bạn** không bao giờ dám thổ lộ với người mình vô cùng kính trọng?" },
    { id: 5, phase: 1, text: "Giữa những bất mãn đó, phẩm chất nào của **bạn** vẫn đang 'sống sót' và lấp lánh? Điều gì ở bản thân mà **bạn** nhất quyết không để nó bị tha hóa?" },
  
    // --- CHẶNG 2: VIỄN CẢNH KHỐC LIỆT (AXIT ĐẬM ĐẶC) ---
    { id: 6, phase: 2, text: "Nếu hành vi không đổi trong 5 năm tới, hãy mô tả một ngày thứ Ba bình thường: **Bạn** thức dậy ở đâu? Cơ thể cảm thấy thế nào? Ai đang rời bỏ **bạn**?" },
    { id: 7, phase: 2, text: "Nhìn ở mốc 10 năm: **Bạn** đã bỏ lỡ những cơ hội nào? Mọi người nói gì về **bạn** khi **bạn** không có mặt ở đó?" },
    { id: 8, phase: 2, text: "Bạn đang ở cuối đời, sống một cuộc đời 'an toàn' và chưa bao giờ phá vỡ khuôn mẫu. Cái giá **bạn** phải trả là gì? **Bạn** đã không cho phép mình trở thành điều gì?" },
    { id: 9, phase: 2, text: "**Bạn** thấy ai đang sống cuộc sống giống với tương lai (tệ hại) mà **bạn** vừa mô tả? **Bạn** cảm thấy thế nào khi nghĩ về việc trở thành họ?" },
    
    // (Lưu ý: Không có câu 10 theo input gốc)
  
    // --- CHẶNG 3: KHOẢNG LẶNG VÀ SỰ TRUNG THÀNH (ĐIỂM DỪNG CHIẾN LƯỢC) ---
    { id: 11, phase: 3, text: "**Mỏ neo liêm chính:** Đâu là những giới hạn đạo đức và giá trị (gia đình, lòng tự trọng) mà **bạn** đã thành công trong việc bảo vệ cho đến ngày hôm nay?" },
    { id: 12, phase: 3, text: "Để không trở thành con người ở câu 9, **bạn** phải từ bỏ căn tính cũ nào? Việc 'khai tử' con người cũ gây ra tổn thất gì về xã hội cho **bạn**?" },
    { id: 13, phase: 3, text: "**Sự thật tàn nhẫn:** **Bạn** đang 'trung thành' với một lời hứa hay một kỳ vọng lỗi thời nào trong quá khứ (ví dụ: trung thành với sự an toàn để làm vui lòng cha mẹ)? **Bạn** sẵn sàng chấm dứt sự trung thành đó chứ?" },
    { id: 14, phase: 3, text: "Lý do nào khiến **bạn** chưa thay đổi mà nghe có vẻ yếu đuối, sợ hãi hoặc lười biếng nhất? Hãy gọi tên sự xấu hổ đó." },
    { id: 15, phase: 3, text: "Nếu hành vi hiện tại là một hình thức tự bảo vệ, thì **bạn** đang bảo vệ cái gì? (Cái tôi, sự lười biếng, hay nỗi sợ bị phán xét?)." },
  
    // --- CHẶNG 4: KIẾN TẠO TẦM NHÌN (ÁNH SÁNG) ---
    { id: 16, phase: 4, text: "Giả sử **bạn** búng tay và sống một cuộc đời mơ ước sau 3 năm. Một ngày thứ Ba bình thường trông như thế nào? Mô tả chi tiết như câu 6." },
    { id: 17, phase: 4, text: "**Bạn** cần tin điều gì về mình để cuộc sống này trở nên tự nhiên? Hãy viết bản tuyên ngôn: 'Tôi là kiểu người...' (Đây là Căn tính mới)." },
    { id: 18, phase: 4, text: "Nếu đã là người đó rồi, điều **bạn** mong muốn làm nhất trong tuần này là gì?" },
    { id: 19, phase: 4, text: "Đâu là '**kẻ thù thực sự**' của **bạn**? (Một niềm tin cũ, một thói quen độc hại)." },
  
    // --- CHẶNG 5: CHIẾN LƯỢC VÀ LẬP LỆNH THỰC THI (TẠO ĐÀ) ---
    { id: 20, phase: 5, text: "Viết một câu tóm gọn về cuộc sống **bạn** ghê sợ.", isManifesto: true },
    { id: 21, phase: 5, text: "Viết một câu tóm gọn về cuộc sống **bạn** hướng tới (Tầm nhìn).", isManifesto: true },
    { id: 22, phase: 5, text: "**Tuyên ngôn Giới hạn (Luật chơi):** **Bạn** tuyên bố không bao giờ hy sinh giá trị cốt lõi nào để đạt được tầm nhìn trên?", isManifesto: true },
    { id: 23, phase: 5, text: "**Khẳng định Căn tính:** Để hiện thực hóa tầm nhìn trên, **bạn** chọn trở thành người như thế nào? (Vd: 'Tôi là kiểu người... ').", isManifesto: true },
    { id: 24, phase: 5, text: "**Phân tích khoảng cách (Gap Analysis):** Đâu là 3 kỹ năng hoặc thói quen **bạn** buộc phải làm chủ trong 12 tháng tới để khớp với Căn tính mong muốn trên đây?", isManifesto: true },
    { id: 25, phase: 5, text: "Cột mốc cụ thể của 30 ngày tiếp theo là gì?" },
    { id: 26, phase: 5, text: "Kế hoạch 2-3 việc cho ngày mai? (Nội dung khi lưu sẽ được tự động tạo Task có thời hạn 24h)." },
  ];