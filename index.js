const {
    Client,
    GatewayIntentBits,
    Events,
    Collection,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    EmbedBuilder,
} = require("discord.js");
const config = require("./config");
const storage = require("./storage");
const {
    createTicketButtons,
    handleTicketButton,
    handleCustomTopicSubmit,
    createCloseModal,
    handleClaimButton,
    handleCloseModal,
    updateStatsChannels,
} = require("./handlers/buttonHandler");
const setcounterCommand = require("./commands/setcounter");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

client.commands = new Collection();
client.commands.set(setcounterCommand.name, setcounterCommand);

client.once(Events.ClientReady, () => {
    console.log(`Bot ${client.user.tag} is ready!`);
    client.user.setPresence({
        activities: [{ name: "VietRealm Support", type: 2 }],
        status: "online",
    });

    // Update stats channels every seconds
    setInterval(async () => {
        const stats = storage.getStats();
        console.log('Updating stats channels:', stats);
        await updateStatsChannels(client.guilds.cache.first());
    }, 30000);
});

client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;

    const BOT_ID = "1351488741515989023";
    if (message.content.includes(`<@${BOT_ID}>`)) {
        const embed = new EmbedBuilder()
          .setTitle("🔵 Đang hoạt động!")
          .setDescription("Bot hiện đang hoạt động và sẵn sàng hỗ trợ.")
          .setColor("#00FF00")
          .setThumbnail(client.user.displayAvatarURL()) // Ảnh đại diện bot
          .setTimestamp();
    
        message.reply({ embeds: [embed] });
      }

    if (message.content.startsWith("!setcounter")) {
        const args = message.content
            .slice("!setcounter ".length)
            .trim()
            .split(/ +/);
        const command = client.commands.get("setcounter");
        if (command) {
            try {
                await command.execute(message, args);
            } catch (error) {
                console.error(error);
                await message.reply({
                    content: "Có lỗi xảy ra khi thực hiện lệnh!",
                    flags: 64,
                });
            }
        }
    }

    if (message.content === "!setup-tickets") {
        if (!message.member.permissions.has("ADMINISTRATOR")) return;

        await message.channel.send({
            content: config.SETUP_MESSAGE,
            components: [createTicketButtons()],
        });
    }
});

client.on(Events.InteractionCreate, async (interaction) => {
    try {
        console.log("Interaction received:", interaction.type);

        if (interaction.isStringSelectMenu()) {
            if (interaction.customId === "ticket_category") {
                console.log(
                    "Select menu interaction, selected value:",
                    interaction.values[0],
                );
                await handleTicketButton(interaction);
            } else if (interaction.customId === "counter_select") {
                console.log(
                    "Counter select menu interaction, selected value:",
                    interaction.values[0],
                );
                const type = interaction.values[0];

                const modal = new ModalBuilder()
                    .setCustomId(`set_${type}_modal`)
                    .setTitle("Điều chỉnh số liệu");

                const numberInput = new TextInputBuilder()
                    .setCustomId("new_value")
                    .setLabel(`Nhập giá trị mới cho ${type}`)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setPlaceholder("Nhập số");

                const firstActionRow = new ActionRowBuilder().addComponents(
                    numberInput,
                );
                modal.addComponents(firstActionRow);

                await interaction.showModal(modal);
            }
        } else if (interaction.isButton()) {
            console.log("Button interaction:", interaction.customId);
            if (interaction.customId === "close_ticket") {
                console.log("Showing close ticket modal");
                await interaction.showModal(createCloseModal());
            } else if (interaction.customId === "claim_ticket") {
                await handleClaimButton(interaction);
            }
        } else if (interaction.isModalSubmit()) {
            console.log("Modal submit interaction:", interaction.customId);

            if (interaction.customId === "custom_topic_modal") {
                await handleCustomTopicSubmit(interaction);
            } else if (interaction.customId === "close_ticket_modal") {
                console.log("Handling close ticket modal");
                await handleCloseModal(interaction);
            } else if (interaction.customId.startsWith("set_")) {
                const type = interaction.customId.split("_")[1];
                console.log("Setting new value for type:", type);

                const newValue = parseInt(
                    interaction.fields.getTextInputValue("new_value"),
                );
                console.log("New value:", newValue);

                if (isNaN(newValue) || newValue < 0) {
                    return await interaction.reply({
                        embeds: [
                            {
                                color: 0xff0000,
                                title: "Lỗi Giá Trị",
                                description: "Số liệu phải là số dương.",
                                timestamp: new Date(),
                            },
                        ],
                        flags: 64,
                    });
                }

                const stats = storage.getStats();
                stats[type] = newValue;

                // Automatically adjust total
                if (type === "processing" || type === "completed") {
                    stats.total = stats.processing + stats.completed;
                } else if (type === "total") {
                    const oldTotal = stats.processing + stats.completed;
                    if (newValue > oldTotal) {
                        stats.completed += newValue - oldTotal;
                    }
                }

                storage.setStats(stats);
                await updateStatsChannels(interaction.guild);

                await interaction.reply({
                    embeds: [
                        {
                            color: 0x2f3136,
                            title: "// Thống Kê Đã Cập Nhật",
                            fields: [
                                {
                                    name: "Tổng số",
                                    value: `${stats.total}`,
                                    inline: true,
                                },
                                {
                                    name: "Đang xử lý",
                                    value: `${stats.processing}`,
                                    inline: true,
                                },
                                {
                                    name: "Đã hoàn thành",
                                    value: `${stats.completed}`,
                                    inline: true,
                                },
                            ],
                            timestamp: new Date(),
                        },
                    ],
                    flags: 64,
                });
            }
        }
    } catch (error) {
        console.error("Error handling interaction:", error);
        try {
            const replyContent = {
                content: "Có lỗi xảy ra khi xử lý yêu cầu.",
                flags: 64,
            };
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(replyContent);
            } else {
                await interaction.reply(replyContent);
            }
        } catch (err) {
            console.error("Error sending error message:", err);
        }
    }
});



client.login(
);
