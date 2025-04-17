const {
    ButtonBuilder,
    ActionRowBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    StringSelectMenuBuilder,
} = require("discord.js");
const config = require("../config");
const storage = require("../storage");
const { createTicketPermissions } = require("../utils/permissions");
const fs = require("fs");
const path = require("path");

function createTicketButtons() {
    const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId("ticket_category")
            .setPlaceholder("Chọn loại hỗ trợ")
            .addOptions(
                Object.entries(config.TICKET_CATEGORIES).map(
                    ([key, category]) => ({
                        label: category.name,
                        value: key,
                        emoji: category.emoji,
                        description: `Tạo ticket ${category.name.toLowerCase()}`,
                    }),
                ),
            ),
    );
    return row;
}

function createCustomTopicModal() {
    const modal = new ModalBuilder()
        .setCustomId("custom_topic_modal")
        .setTitle("Nhập chủ đề hỗ trợ");

    const topicInput = new TextInputBuilder()
        .setCustomId("topic")
        .setLabel("Chủ đề bạn cần hỗ trợ là gì?")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("Ví dụ: Hỗ trợ đổi tên nhân vật")
        .setRequired(true);

    const firstActionRow = new ActionRowBuilder().addComponents(topicInput);
    modal.addComponents(firstActionRow);
    return modal;
}

function createCloseModal() {
    const modal = new ModalBuilder()
        .setCustomId("close_ticket_modal")
        .setTitle("Đóng Ticket");

    const reasonInput = new TextInputBuilder()
        .setCustomId("close_reason")
        .setLabel("Lý do đóng ticket?")
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder("Nhập lý do đóng ticket...")
        .setRequired(false);

    const firstActionRow = new ActionRowBuilder().addComponents(reasonInput);
    modal.addComponents(firstActionRow);
    return modal;
}

function createCloseButton() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("close_ticket")
            .setLabel("Close Ticket")
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId("claim_ticket")
            .setLabel("Claim Ticket")
            .setStyle(ButtonStyle.Primary),
    );
}

async function handleClaimButton(interaction) {
    const staffRole = interaction.guild.roles.cache.find(
        (r) => r.name === config.STAFF_ROLE,
    );
    if (!interaction.member.roles.cache.has(staffRole?.id)) {
        return await interaction.reply({
            content: "Bạn không có quyền claim ticket.",
            flags: 64,
        });
    }

    const ticket = storage.claimTicket(
        interaction.channel.id,
        interaction.user.id,
    );
    if (ticket) {
        await interaction.reply({
            embeds: [
                {
                    title: "Ticket Claimed",
                    description: `Ticket này đã được xử lý bởi ${interaction.user}`,
                    color: 0x2f3136,
                },
            ],
        });
    }
}

async function handleCustomTopicSubmit(interaction) {
    console.log("Handling custom topic submit");
    const customTopic = interaction.fields.getTextInputValue("topic");
    console.log("Custom topic:", customTopic);
    await createTicketChannel(interaction, customTopic);
}

async function handleCloseModal(interaction) {
    console.log("Handling close ticket modal");
    const reason = interaction.fields.getTextInputValue("close_reason");
    console.log("Close reason:", reason);

    const ticket = storage.tickets.get(interaction.channel.id);
    if (!ticket) {
        console.log("No ticket found for channel:", interaction.channel.id);
        return await interaction.reply({
            content: "Không tìm thấy thông tin ticket.",
            flags: 64,
        });
    }

    try {
        // Generate HTML logs
        const messages = await interaction.channel.messages.fetch();
        const { generateTicketHTML } = require("../utils/logGenerator");
        const htmlContent = generateTicketHTML(
            Array.from(messages.values()).reverse(),
            ticket,
        );

        // Save HTML file
        const logFileName = `ticket-${ticket.id}-logs.html`;
        fs.writeFileSync(
            path.join(__dirname, "..", "logs", logFileName),
            htmlContent,
        );

        // Create embed for notifications
        const closeEmbed = {
            title: `Ticket #${ticket.id} đã được đóng`,
            description: `Chủ đề: ${ticket.category}`,
            fields: [
                {
                    name: "Người mở ticket",
                    value: `<@${ticket.userId}>`,
                    inline: true,
                },
                {
                    name: "Người đóng ticket",
                    value: `<@${interaction.user.id}>`,
                    inline: true,
                },
                {
                    name: "Người xử lý",
                    value: ticket.claimedBy
                        ? `<@${ticket.claimedBy}>`
                        : "Chưa có",
                    inline: true,
                },
                {
                    name: "Thời gian mở",
                    value: `<t:${Math.floor(ticket.createdAt / 1000)}:F>`,
                    inline: true,
                },
                {
                    name: "Thời gian đóng",
                    value: `<t:${Math.floor(Date.now() / 1000)}:F>`,
                    inline: true,
                },
                {
                    name: "Lý do đóng",
                    value: reason || "Không có lý do",
                    inline: false,
                },
            ],
            color: 0x2f3136,
        };

        // Send notifications
        try {
            // Send to ticket creator
            const creator = await interaction.client.users.fetch(ticket.userId);
            await creator.send({
                embeds: [closeEmbed],
                files: [path.join(__dirname, "..", "logs", logFileName)],
            });
            console.log("Log sent to ticket creator:", ticket.userId);

            // Send to claimer if exists
            if (ticket.claimedBy) {
                const claimer = await interaction.client.users.fetch(
                    ticket.claimedBy,
                );
                await claimer.send({
                    embeds: [closeEmbed],
                    files: [path.join(__dirname, "..", "logs", logFileName)],
                });
                console.log("Log sent to ticket claimer:", ticket.claimedBy);
            }

            // Send to logs channel
            let logsChannel = interaction.guild.channels.cache.find(
                (c) => c.name === "ticket-logs",
            );
            if (!logsChannel) {
                // Create logs channel if it doesn't exist
                const supportCategory = interaction.guild.channels.cache.find(
                    (c) => c.name === config.SUPPORT_CATEGORY,
                );
                logsChannel = await interaction.guild.channels.create({
                    name: "ticket-logs",
                    type: 0, // Text channel
                    parent: supportCategory,
                });
            }
            try {
                // Send to logs channel
                const logsChannel = interaction.guild.channels.cache.find(
                    (c) => c.name === "ticket-logs",
                );
                if (logsChannel) {
                    await logsChannel.send({
                        embeds: [closeEmbed],
                        files: [
                            path.join(__dirname, "..", "logs", logFileName),
                        ],
                    });
                    console.log("Log sent to ticket-logs channel");
                }
            } catch (error) {
                console.error("Error sending logs:", error);
            }
        } catch (error) {
            console.error("Error sending notifications:", error);
        }

        // Reply and close the ticket
        await interaction.reply("Ticket sẽ đóng sau 3 giây.");

        const channel = interaction.channel;
        setTimeout(async () => {
            try {
                await channel.delete();
            } catch (error) {
                console.error("Không thể xóa kênh:", error);
            }
        }, 3000);

        // Send close message in channel and wait for it to be sent
        const closeMessage = await interaction.channel.send({
            embeds: [
                {
                    title: "Ticket Closed",
                    description: `Ticket đã được đóng bởi ${interaction.user}\nLý do: ${reason}`,
                    color: 0x2f3136,
                    timestamp: new Date(),
                },
            ],
        });

        // Close ticket in storage
        const closedTicket = storage.closeTicket(
            interaction.channel.id,
            interaction.user.id,
            reason,
        );
        if (!closedTicket) {
            throw new Error("Failed to close ticket in storage");
        }
        await updateStatsChannels(interaction.guild);

        // Ensure all messages are sent before deleting the channel
        await Promise.all([
            new Promise((resolve) => setTimeout(resolve, 2000)), // Wait for 2 seconds
            closeMessage.fetch(), // Ensure the message is fully sent
        ]);

        // Delete the channel after ensuring messages are sent
        try {
            //await interaction.channel.delete();
            console.log("Ticket channel deleted successfully");
        } catch (deleteError) {
            console.error("Error deleting channel:", deleteError);
            throw deleteError; // Re-throw to be caught by outer catch block
        }
    } catch (error) {
        console.error("Error in handleCloseModal:", error);
        if (!interaction.replied) {
            await interaction.reply({
                content: "Có lỗi xảy ra khi đóng ticket.",
                flags: 64,
            });
        }
    }
}

async function handleTicketButton(interaction) {
    if (interaction.isStringSelectMenu()) {
        console.log("Selected value:", interaction.values[0]);
        const categoryKey = interaction.values[0];
        console.log("Category key:", categoryKey);

        if (categoryKey === "CUSTOM") {
            console.log("Showing custom topic modal");
            await interaction.showModal(createCustomTopicModal());
            return;
        }

        const category = config.TICKET_CATEGORIES[categoryKey];
        if (!category) {
            console.error("Invalid category key:", categoryKey);
            return;
        }

        await createTicketChannel(interaction, category.name);
    }
}

async function createTicketChannel(interaction, category) {
    const guild = interaction.guild;
    const channelName = `ticket-${interaction.user.username}-${storage.lastTicketId + 1}`;

    let supportCategory = guild.channels.cache.find(
        (c) => c.name === config.SUPPORT_CATEGORY && c.type === 4,
    );
    if (!supportCategory) {
        supportCategory = await guild.channels.create({
            name: config.SUPPORT_CATEGORY,
            type: 4,
        });
    }

    const staffRole = guild.roles.cache.find(
        (r) => r.name === config.STAFF_ROLE,
    );
    const permissionOverwrites = [
        {
            id: guild.roles.everyone.id,
            deny: ["ViewChannel"],
        },
        {
            id: interaction.user.id,
            allow: ["ViewChannel", "SendMessages"],
        },
    ];

    if (staffRole) {
        permissionOverwrites.push({
            id: staffRole.id,
            allow: ["ViewChannel", "SendMessages"],
        });
    }

    const channel = await guild.channels.create({
        name: channelName,
        type: 0,
        parent: supportCategory,
        permissionOverwrites,
    });

    const ticket = storage.createTicket(
        interaction.user.id,
        channel.id,
        category,
    );

    const createEmbed = {
        color: 0x2f3136,
        title: "Ticket Created",
        description: `<@${interaction.user.id}> đã mở ticket với chủ đề: **${category}\n<@&${staffRole?.id}>**`,
        timestamp: new Date(),
    };

    await channel.send({
        embeds: [createEmbed],
        components: [createCloseButton()],
    });

    const createEmbed2 = {
        title: "Ticket Created",
        color: 0x2f3136,
        description: `Ticket của bạn đã được tạo tại ${channel}`,
        fields: [
            { name: "Category", value: category, inline: true },
            { name: "User", value: `<@${interaction.user.id}>`, inline: true },
        ],
        timestamp: new Date(),
    };

    const msg = await interaction
        .reply({
            embeds: [createEmbed2],
        })
        .then((response) => response);

    setTimeout(async () => {
        try {
            await msg.delete();
        } catch (error) {
            console.error("Không thể xóa tin nhắn:", error);
        }
    }, 3000);

    await updateStatsChannels(guild);
}

async function updateStatsChannels(guild) {
    const stats = storage.getStats();
    const statsChannels = {
        TOTAL: `${config.STATS_CHANNELS.TOTAL}: ${stats.total}`,
        PROCESSING: `${config.STATS_CHANNELS.PROCESSING}: ${stats.processing}`,
        COMPLETED: `${config.STATS_CHANNELS.COMPLETED}: ${stats.completed}`,
    };

    const supportCategory = guild.channels.cache.find(
        (c) => c.name === config.SUPPORT_CATEGORY,
    );

    for (const [key, name] of Object.entries(statsChannels)) {
        let channel = guild.channels.cache.find((c) =>
            c.name.startsWith(config.STATS_CHANNELS[key]),
        );
        if (!channel) {
            channel = await guild.channels.create({
                name,
                type: 2,
                parent: supportCategory,
            });
        } else {
            await channel.setName(name);
        }
    }
}

module.exports = {
    createTicketButtons,
    handleTicketButton,
    handleCustomTopicSubmit,
    createCloseModal,
    handleClaimButton,
    handleCloseModal,
    updateStatsChannels,
};
