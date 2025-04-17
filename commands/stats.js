
const { SlashCommandBuilder } = require('discord.js');
const storage = require('../storage');
const { hasAdminPermission } = require('../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Quản lý thống kê ticket')
        .setDMPermission(false)
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Điều chỉnh số liệu thống kê')
                .addIntegerOption(option => 
                    option.setName('amount')
                        .setDescription('Số lượng')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('Loại thống kê')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Tổng số', value: 'total' },
                            { name: 'Đang xử lý', value: 'processing' },
                            { name: 'Đã hoàn thành', value: 'completed' }
                        ))),

    async execute(interaction) {
        if (!hasAdminPermission(interaction.member)) {
            return interaction.reply({ 
                embeds: [{
                    color: 0xFF0000,
                    title: 'Lỗi Quyền Hạn',
                    description: 'Bạn không có quyền sử dụng lệnh này.',
                    timestamp: new Date()
                }],
                flags: 64 
            });
        }

        const subcommand = interaction.options.getSubcommand();
        if (subcommand === 'set') {
            const amount = interaction.options.getInteger('amount');
            const type = interaction.options.getString('type');
            const stats = storage.getStats();

            // Update the specified stat
            stats[type] = amount;

            // Automatically adjust total
            if (type === 'processing' || type === 'completed') {
                stats.total = stats.processing + stats.completed;
            } else if (type === 'total') {
                // When setting total, distribute the difference to completed
                const oldTotal = stats.processing + stats.completed;
                if (amount > oldTotal) {
                    stats.completed += (amount - oldTotal);
                }
            }

            storage.setStats(stats);
            await require('../handlers/buttonHandler').updateStatsChannels(interaction.guild);
            
            await interaction.reply({ 
                embeds: [{
                    color: 0x2f3136,
                    title: 'Thống Kê Đã Cập Nhật',
                    fields: [
                        { name: 'Tổng số', value: `${stats.total}`, inline: true },
                        { name: 'Đang xử lý', value: `${stats.processing}`, inline: true },
                        { name: 'Đã hoàn thành', value: `${stats.completed}`, inline: true }
                    ],
                    timestamp: new Date()
                }],
                flags: 64 
            });
        }
    }
};
