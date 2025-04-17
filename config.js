module.exports = {
    TOKEN: process.env.DISCORD_TOKEN,
    STAFF_ROLE: "⚜️ Staff",
    TICKET_CATEGORIES: {
        TECH: {
            name: "Hỗ trợ kỹ thuật",
            emoji: "🔧",
        },
        TOPUP: {
            name: "Hỗ trợ nạp thẻ",
            emoji: "💳",
        },
        REALM: {
            name: "Realm Survival",
            emoji: "🎮",
        },
        CUSTOM: {
            name: "Chủ đề khác",
            emoji: "📝",
        },
    },
    SUPPORT_CATEGORY: "Hỗ trợ",
    STATS_CHANNELS: {
        TOTAL: "TỔNG TICKETS",
        PROCESSING: "ĐANG XỬ LÝ",
        COMPLETED: "ĐÃ XỬ LÝ",
    },
    SETUP_MESSAGE:
        "```🎫 TẠO PHIẾU HỖ TRỢ\nKhi tạo ticket, hãy đảm bảo thể hiện đầy đủ thông tin bạn cần được hỗ trợ, và chờ admin - staff hỗ trợ bạn.\n\nKhung giờ hỗ trợ: 24/7\nVIETREALM TICKET | STAFF VIETREALM```",
};
