
const fs = require('fs');
const path = require('path');

function formatDate(date) {
    return new Date(date).toLocaleString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
    });
}

function generateTicketEmbed(ticket, reason) {
    return {
        title: `Ticket #${ticket.id} đã được đóng`,
        fields: [
            { name: 'Chủ đề', value: ticket.category },
            { name: 'Người mở ticket', value: `<@${ticket.userId}>` },
            { name: 'Người đóng ticket', value: `<@${ticket.closedBy}>` },
            { name: 'Người xử lý', value: ticket.claimedBy ? `<@${ticket.claimedBy}>` : 'Chưa có' },
            { name: 'Thời gian mở', value: formatDate(ticket.createdAt) },
            { name: 'Thời gian đóng', value: formatDate(new Date()) },
            { name: 'Lý do đóng', value: reason || 'Không có lý do' }
        ],
        color: 0x2f3136,
        timestamp: new Date()
    };
}

function generateTicketHTML(messages, ticket) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {
                background-color: #36393f;
                color: #dcddde;
                font-family: 'gg sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
                margin: 0;
                padding: 20px;
            }
            .header {
                background-color: #2f3136;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 20px;
            }
            .header h1 {
                color: white;
                margin: 0;
            }
            .header-field {
                margin: 10px 0;
                color: #b9bbbe;
            }
            .message {
                display: flex;
                padding: 10px 20px;
                margin: 0 -20px;
            }
            .message:hover {
                background-color: #32353b;
            }
            .avatar {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                margin-right: 15px;
            }
            .content {
                flex: 1;
            }
            .author {
                color: white;
                font-weight: 500;
                margin-bottom: 4px;
            }
            .timestamp {
                color: #72767d;
                font-size: 0.75rem;
                margin-left: 8px;
            }
            .text {
                color: #dcddde;
                white-space: pre-wrap;
            }
            .attachment {
                max-width: 400px;
                border-radius: 4px;
                margin: 8px 0;
            }
            .sticker {
                width: 160px;
                height: 160px;
                margin: 8px 0;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Ticket #${ticket.id}</h1>
            <div class="header-field">Chủ đề: ${ticket.category}</div>
            <div class="header-field">Người mở: ${ticket.userName}</div>
            <div class="header-field">Thời gian mở: ${formatDate(ticket.createdAt)}</div>
            <div class="header-field">Thời gian đóng: ${formatDate(new Date())}</div>
        </div>
        ${messages.map(msg => {
            let content = '';
            
            // Add attachments
            if (msg.attachments?.size > 0) {
                content += msg.attachments.map(attachment => {
                    if (attachment.contentType?.startsWith('image/')) {
                        return `<img class="attachment" src="${attachment.url}" alt="Attachment">`;
                    }
                    return `<a href="${attachment.url}" target="_blank">${attachment.name}</a>`;
                }).join('<br>');
            }
            
            // Add stickers
            if (msg.stickers?.size > 0) {
                content += msg.stickers.map(sticker => 
                    `<img class="sticker" src="${sticker.url}" alt="${sticker.name}">`
                ).join('');
            }

            return `
            <div class="message">
                <img class="avatar" src="${msg.author.displayAvatarURL()}" alt="${msg.author.username}">
                <div class="content">
                    <div>
                        <span class="author">${msg.author.username}</span>
                        <span class="timestamp">${formatDate(msg.createdAt)}</span>
                    </div>
                    <div class="text">${msg.content}</div>
                    ${content}
                </div>
            </div>`;
        }).join('')}
    </body>
    </html>`;
}

module.exports = { generateTicketHTML, generateTicketEmbed };
