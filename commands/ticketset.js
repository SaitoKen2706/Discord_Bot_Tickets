
const { SlashCommandBuilder } = require('discord.js');
const storage = require('../storage');
const { hasAdminPermission } = require('../utils/permissions');
const { updateStatsChannels } = require('../handlers/buttonHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticketset')
        .setDescription('Điều chỉnh bộ đếm ticket')
        .addIntegerOption(option => 
            option.setName('value')
                .setDescription('Giá trị cần đặt')
                .setRequired(true)),

    async execute(interaction) {
        if (!hasAdminPermission(interaction.member)) {
            return interaction.reply({ 
                embeds: [{
                    color: 0xFF0000,
                    description: 'Bạn không có quyền sử dụng lệnh này.',
                    timestamp: new Date()
                }],
                flags: 64 
            });
        }

        const newValue = interaction.options.getInteger('value');
        if (newValue < 0) {
            return interaction.reply({
                embeds: [{
                    color: 0xFF0000,
                    description: 'Giá trị không thể âm.',
                    timestamp: new Date()
                }],
                flags: 64
            });
        }

        storage.setLastTicketId(newValue);
        await updateStatsChannels(interaction.guild);
            
        await interaction.reply({ 
            embeds: [{
                color: 0x2f3136,
                description: `Đã đặt bộ đếm ticket thành ${newValue}`,
                timestamp: new Date()
            }],
            flags: 64 
        });
    }
};
