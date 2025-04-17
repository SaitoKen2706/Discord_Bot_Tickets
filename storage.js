const fs = require('fs');
const path = require('path');

const STORAGE_FILE = 'ticket_data.json';

class TicketStorage {
    constructor() {
        this.loadFromFile();
    }

    loadFromFile() {
        try {
            if (fs.existsSync(STORAGE_FILE)) {
                const data = JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf8'));
                this.tickets = new Map(data.tickets);
                this.stats = data.stats;
                this.lastTicketId = data.lastTicketId;
            } else {
                this.tickets = new Map();
                this.stats = {
                    total: 0,
                    processing: 0,
                    completed: 0
                };
                this.lastTicketId = 0;
                this.saveToFile();
            }
        } catch (error) {
            console.error('Error loading storage:', error);
            this.tickets = new Map();
            this.stats = {
                total: 0,
                processing: 0,
                completed: 0
            };
            this.lastTicketId = 0;
        }
    }

    saveToFile() {
        try {
            const data = {
                tickets: Array.from(this.tickets.entries()),
                stats: this.stats,
                lastTicketId: this.lastTicketId
            };
            fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('Error saving storage:', error);
        }
    }

    claimTicket(channelId, staffId) {
        const ticket = this.tickets.get(channelId);
        if (ticket) {
            ticket.claimedBy = staffId;
            ticket.claimedAt = Date.now();
            this.saveToFile();
            return ticket;
        }
        return null;
    }

    closeTicket(channelId, closedBy, reason) {
        const ticket = this.tickets.get(channelId);
        if (ticket) {
            ticket.status = 'completed';
            ticket.closedAt = Date.now();
            ticket.closedBy = closedBy;
            ticket.closeReason = reason;
            this.stats.processing--;
            this.stats.completed++;
            this.tickets.delete(channelId); // Remove ticket from active tickets
            this.saveToFile();
            return ticket;
        }
        return null;
    }

    createTicket(userId, channelId, category) {
        this.lastTicketId++;
        const ticket = {
            id: this.lastTicketId,
            userId,
            channelId,
            category,
            status: 'processing',
            createdAt: Date.now()
        };
        this.tickets.set(channelId, ticket);
        this.stats.total++;
        this.stats.processing++;
        this.saveToFile();
        return ticket;
    }

    getStats() {
        return this.stats;
    }

    setStats(newStats) {
        this.stats = { ...this.stats, ...newStats };
        this.saveToFile();
    }
}

module.exports = new TicketStorage();