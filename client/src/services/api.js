const API_BASE = '/api';

export const api = {
    // RFPs
    async getRfps() {
        const res = await fetch(`${API_BASE}/rfps`);
        return res.json();
    },

    async getRfp(id) {
        const res = await fetch(`${API_BASE}/rfps/${id}`);
        return res.json();
    },

    async generateRfp(query) {
        const res = await fetch(`${API_BASE}/rfps/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });
        return res.json();
    },

    async createRfp(data) {
        const res = await fetch(`${API_BASE}/rfps`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    },

    async sendRfpToVendors(rfpId, vendorIds) {
        const res = await fetch(`${API_BASE}/rfps/${rfpId}/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ vendorIds })
        });
        return res.json();
    },

    async compareProposals(rfpId) {
        const res = await fetch(`${API_BASE}/rfps/${rfpId}/compare`);
        return res.json();
    },

    // Vendors
    async getVendors() {
        const res = await fetch(`${API_BASE}/vendors`);
        return res.json();
    },

    async createVendor(data) {
        const res = await fetch(`${API_BASE}/vendors`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    },

    async deleteVendor(id) {
        const res = await fetch(`${API_BASE}/vendors/${id}`, {
            method: 'DELETE'
        });
        return res.json();
    },

    // Proposals
    async getProposals(rfpId) {
        const res = await fetch(`${API_BASE}/proposals?rfpId=${rfpId}`);
        return res.json();
    },

    async refreshProposals() {
        const res = await fetch(`${API_BASE}/proposals/refresh-sync`, {
            method: 'POST'
        });
        return res.json();
    }
};
