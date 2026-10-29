import { SpeechPreset, TtsVoice, TtsStyle } from "./types";

export const SPEECH_PRESETS: SpeechPreset[] = [
  {
    id: "toi-di-hoc",
    title: "Tôi Đi Học",
    author: "Thanh Tịnh",
    category: "Văn học cổ điển",
    text: "Hằng năm cứ vào cuối thu, lá ngoài đường rụng nhiều và trên không có những đám mây bàng bạc, lòng tôi lại mơn man những kỷ niệm hoang mang của buổi tựu trường. Tôi không thể nào quên được những cảm giác trong sáng ấy nảy nở trong lòng tôi như mấy cánh hoa tươi mỉm cười giữa bầu trời quang đãng. Buổi mai hôm ấy, một buổi mai đầy sương thu và gió lạnh, mẹ tôi âu yếm nắm tay tôi dẫn đi trên con đường làng dài và hẹp.",
  },
  {
    id: "hai-dua-tre",
    title: "Hai Đứa Trẻ",
    author: "Thạch Lam",
    category: "Văn học cổ điển",
    text: "An và Liên gánh hàng nước dưới bóng tối của cây bàng. Đêm tối tràn ngập dần, hương cỏ đất bốc lên thơm ngát của vùng quê nghèo. Tiếng trống thu không trên chòi của huyện nhỏ, từng tiếng một vang ra để gọi buổi chiều. Phương tây đỏ rực như lửa cháy và những đám mây hồng như hòn than sắp tàn. Giữa những giờ phút tịch liêu ấy, tâm hồn hai đứa trẻ lại thổn thức những nỗi niềm xưa cũ, lặng lẽ đợi chuyến tàu đêm đi qua...",
  },
  {
    id: "chieu-mua-que",
    title: "Khói Lam Chiều",
    author: "Hoài Nam",
    category: "Kỷ niệm tuổi thơ",
    text: "Chiều nay mưa rơi ngoài hiên vắng, tiếng mưa rả rích đưa ta trở về những ngày ấu thơ đầy nắng gió. Tiếng sáo diều vi vu trên cánh đồng xa, bóng dáng mẹ già liêu xiêu bên bếp lửa rơm hồng ấm áp, phảng phất khói lam chiều quyện vào sương sớm. Những ký ức đơn sơ, mộc mạc ấy cứ đong đầy trong tim, như một góc bình yên trú ẩn sau những giông bão của cuộc đời.",
  },
  {
    id: "pho-co-ky-uc",
    title: "Mùa Thu Hà Nội",
    author: "Quốc Bảo",
    category: "Cảm xúc phố xưa",
    text: "Hà Nội mùa thu, hương cốm non thoảng bay theo cơn gió heo may se lạnh. Những tán cây bàng lá đỏ, những con đường cổ kính xao xác lá rụng đầy. Ta tìm lại bóng hình xưa trong tiếng chuông chùa Trấn Vũ tịch liêu, nghe tiếng rao đêm du dương, trầm mặc giữa sương mờ. Những khoảnh khắc dịu dàng ấy tưởng chừng đã ngủ quên, nay lại ùa về như một giấc mơ đầy lãng mạn.",
  },
  {
    id: "bep-lua-ba",
    title: "Bếp Lửa Hoài Niệm",
    author: "Sông Lam",
    category: "Tình cảm gia đình",
    text: "Cháu thương bà biết mấy nắng mưa. Nhớ những ngày mùa đông lạnh buốt, bàn tay bà gầy guộc nhóm lên bếp củi ấm nồng, xua tan cái giá lạnh của đất trời. Khói bếp hun nhèm mắt cháu, mùi ngô nướng thơm lừng hòa trong tiếng cười ấm áp của bà. Giờ đây cháu đã đi xa, nhưng ngọn lửa từ bàn tay bà vẫn luôn soi sáng và sưởi ấm tâm hồn cháu giữa dòng đời ngược xuôi.",
  }
];

export const TTS_VOICES: TtsVoice[] = [
  {
    id: "Charon",
    name: "Charon",
    displayName: "Nam Trầm Ấm",
    description: "Giọng nam Bắc trầm ấm, sâu lắng, đặc biệt thích hợp kể chuyện đêm muộn hoặc đọc tản văn đầy tự sự.",
    gender: "nam",
    tone: "Trầm tối, dày dặn, ấm áp",
  },
  {
    id: "Aoede",
    name: "Aoede",
    displayName: "Nữ Ngọt Ngào",
    description: "Giọng nữ Bắc vô cùng ngọt ngào, truyền cảm, trong trẻo như sương mai, ngập tràn xúc cảm kỷ niệm.",
    gender: "nu",
    tone: "Trong trẻo, ấm áp, truyền cảm",
  },
  {
    id: "Zephyr",
    name: "Zephyr",
    displayName: "Nam Truyền Cảm",
    description: "Giọng đọc trung tính, truyền cảm, du dương, có độ rung cảm xúc cao như đang dạt dào kỷ niệm xưa.",
    gender: "nam",
    tone: "Mềm mại, tự nhiên, bay bổng",
  },
  {
    id: "Kore",
    name: "Kore",
    displayName: "Nữ Thầm Thì",
    description: "Giọng nữ miền Bắc nhỏ nhẹ, dịu dàng, thì thầm thủ thỉ bên tai như đang kể chuyện tâm sự sâu kín.",
    gender: "nu",
    tone: "Nhẹ nhàng, êm dịu, thầm thì",
  },
  {
    id: "Fenrir",
    name: "Fenrir",
    displayName: "Nam Chững Chạc",
    description: "Giọng nam chững chạc, vang và rõ chữ, phù hợp với các đoạn văn miêu tả phong cảnh hay hồi ký triết lý.",
    gender: "nam",
    tone: "Rõ ràng, đĩnh đạc, chững chạc",
  },
  {
    id: "Puck",
    name: "Puck",
    displayName: "Nam Tự Sự Sáng",
    description: "Chất giọng nam sáng hơn, năng động nhưng vẫn giàu chất thơ, lột tả nét hồn nhiên của tuổi học trò hoài niệm.",
    gender: "nam",
    tone: "Sáng rõ, biểu cảm, tươi vui nhẹ",
  }
];

export const TTS_STYLES: TtsStyle[] = [
  {
    id: "hoai_niem",
    name: "Hoài Niệm Xưa",
    description: "Trầm ấm, đượm chút buồn man mác, thầm thì đầy cảm xúc hồi tưởng.",
    colorClass: "from-amber-100 to-amber-200 border-amber-300 text-amber-900 bg-amber-50/50",
  },
  {
    id: "truyen_cam",
    name: "Ấm Áp Truyền Cảm",
    description: "Ngọt ngào, ấm lòng, nhấn nhá tự nhiên, tràn ngập tình cảm thiết tha.",
    colorClass: "from-rose-100 to-rose-200 border-rose-300 text-rose-900 bg-rose-50/50",
  },
  {
    id: "cham_rai",
    name: "Chậm Rãi Suy Tư",
    description: "Chậm, lắng đọng, mỗi câu chữ mang sức nặng của thời gian và chiêm nghiệm.",
    colorClass: "from-stone-100 to-stone-200 border-stone-300 text-stone-900 bg-stone-50/50",
  },
  {
    id: "nhe_nhang",
    name: "Dịu Dàng Sâu Lắng",
    description: "Mềm mại, nhẹ bay, như làn gió thu thoảng qua đưa hồn thơ bay bổng.",
    colorClass: "from-emerald-100 to-emerald-200 border-emerald-300 text-emerald-900 bg-emerald-50/50",
  },
  {
    id: "vui_tuoi",
    name: "Vui Tươi Phấn Khởi",
    description: "Hào hứng, rạng rỡ, sinh động, tràn đầy năng lượng tích cực và tươi ấm.",
    colorClass: "from-sky-100 to-sky-200 border-sky-300 text-sky-900 bg-sky-50/50",
  }
];

export const LOADING_PHRASES = [
  "Đang khơi dậy những dòng ký ức xa xôi...",
  "Đang dệt những sợi tơ âm thanh trầm ấm...",
  "Gửi gắm nỗi niềm hoài niệm xưa vào từng câu chữ...",
  "Đang hòa nhịp xúc cảm sâu lắng của giọng nam miền Bắc...",
  "Đang tạo nốt nhạc trầm ấm, du dương và bay bổng...",
  "Chờ một chút, ký ức xưa đang tìm lại lời thì thầm..."
];
