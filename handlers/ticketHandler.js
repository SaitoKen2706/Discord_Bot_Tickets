const { ChannelType } = require('discord.js');
const config = require('../config');
const storage = require('../storage');
const { createTicketPermissions } = require('../utils/permissions');
const { updateStatsChannels } = require('./buttonHandler');

class TicketHandler {
    /**
     * Creates a new ticket channel in the support category
     */
    static async createTicketChannel(guild, user, category) {
        // Find or create support category
        let supportCategory = await this.getOrCreateSupportCategory(guild);
        
        // Create ticket channel name
        const ticketNumber = storage.lastTicketId + 1;
        const channelName = `ticket-${user.username}-${ticketNumber}`;

        // Create the ticket channel
        const channel = await guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            parent: supportCategory,
            permissionOverwrites: createTicketPermissions(guild, user)
        });

        return {
            channel,
            ticketNumber
        };
    }

    /**
     * Gets or creates the support category
     */
    static async getOrCreateSupportCategory(guild) {
        let supportCategory = guild.channels.cache.find(
            c => c.name === config.SUPPORT_CATEGORY && c.type === ChannelType.GuildCategory
        );

        if (!supportCategory) {
            supportCategory = await guild.channels.create({
                name: config.SUPPORT_CATEGORY,
                type: ChannelType.GuildCategory
            });

            // Create stats channels
            await this.createStatsChannels(guild, supportCategory);
        }

        return supportCategory;
    }

    /**
     * Creates the statistics voice channels
     */
    static async createStatsChannels(guild, category) {
        const stats = storage.getStats();
        const statsChannels = {
            TOTAL: `${config.STATS_CHANNELS.TOTAL}: ${stats.total}`,
            PROCESSING: `${config.STATS_CHANNELS.PROCESSING}: ${stats.processing}`,
            COMPLETED: `${config.STATS_CHANNELS.COMPLETED}: ${stats.completed}`
        };

        for (const [key, name] of Object.entries(statsChannels)) {
            await guild.channels.create({
                name,
                type: ChannelType.GuildVoice,
                parent: category
            });
        }
    }

    /**
     * Processes a ticket closure
     */
    static async closeTicket(channel) {
        const ticket = storage.closeTicket(channel.id);
        if (!ticket) {
            throw new Error('Ticket not found');
        }

        // Update stats channels
        await updateStatsChannels(channel.guild);

        // Delete the ticket channel
        await channel.delete();

        return ticket;
    }

    /**
     * Validates and updates ticket statistics
     */
    static validateStats(total, processing, completed) {
        if (total < 0 || processing < 0 || completed < 0) {
            throw new Error('Statistics cannot be negative');
        }

        if (processing + completed !== total) {
            throw new Error('Total tickets must equal processing + completed tickets');
        }

        return true;
    }

    /**
     * Gets the staff role mention string
     */
    static getStaffMention(guild) {
        const staffRole = guild.roles.cache.find(r => r.name === config.STAFF_ROLE);
        return staffRole ? `<@&${staffRole.id}>` : '@staff';
    }

    /**
     * Formats the ticket information message
     */
    static formatTicketMessage(user, category, ticketNumber) {
        return `
Ticket #${ticketNumber}
User: <@${user.id}>
Category: ${category}

Please wait for a staff member to assist you.`;
    }
}

module.exports = TicketHandler;
