const { PermissionFlagsBits } = require('discord.js');

function hasAdminPermission(member) {
    return member.permissions.has(PermissionFlagsBits.ManageGuild);
}

function createTicketPermissions(guild, user) {
    return [
        {
            id: guild.roles.everyone.id,
            deny: [PermissionFlagsBits.ViewChannel],
        },
        {
            id: user.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
        },
        {
            id: guild.roles.cache.find(r => r.name === 'staff')?.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
        }
    ];
}

module.exports = {
    hasAdminPermission,
    createTicketPermissions
};
