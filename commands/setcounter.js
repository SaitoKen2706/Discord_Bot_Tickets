const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const storage = require('../storage');
const { hasAdminPermission } = require('../utils/permissions');

module.exports = {
    name: 'setcounter',
    async execute(message, args) {
        if (!hasAdminPermission(message.member)) {
            return message.reply({ 
                embeds: [{
                    color: 0xFF0000,
                    title: 'Lỗi Quyền Hạn',
                    description: 'Bạn không có quyền sử dụng lệnh này.',
                    timestamp: new Date()
                }],
                flags: 64 
            });
        }

        const stats = storage.getStats();

        const row = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('counter_select')
                    .setPlaceholder('Chọn loại số liệu cần điều chỉnh')
                    .addOptions([
                        {
                            label: 'Tổng số',
                            description: `Giá trị hiện tại: ${stats.total}`,
                            value: 'total',
                            emoji: '📊'
                        },
                        {
                            label: 'Đang xử lý',
                            description: `Giá trị hiện tại: ${stats.processing}`,
                            value: 'processing',
                            emoji: '⏳'
                        },
                        {
                            label: 'Đã hoàn thành',
                            description: `Giá trị hiện tại: ${stats.completed}`,
                            value: 'completed',
                            emoji: '✅'
                        }
                    ])
            );

        await message.reply({
            embeds: [{
                color: 0x2f3136,
                title: '// Điều Chỉnh Thống Kê',
                description: 'Chọn loại số liệu bạn muốn điều chỉnh:',
                timestamp: new Date()
            }],
            components: [row],
            flags: 64
        });
    }
};