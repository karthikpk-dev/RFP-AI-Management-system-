import { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function Vendors() {
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', company: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadVendors();
    }, []);

    async function loadVendors() {
        try {
            const result = await api.getVendors();
            if (result.success) setVendors(result.data);
        } catch (err) {
            console.error('Failed to load vendors:', err);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!formData.name.trim() || !formData.email.trim()) {
            alert('Name and email are required');
            return;
        }
        setSaving(true);
        try {
            const result = await api.createVendor({
                name: formData.name,
                email: formData.email,
                contactInfo: { phone: formData.phone, company: formData.company }
            });
            if (result.success) {
                setVendors([...vendors, result.data]);
                setFormData({ name: '', email: '', phone: '', company: '' });
                setShowForm(false);
            } else {
                alert('Failed: ' + (result.error || 'Unknown error'));
            }
        } catch (err) {
            alert('Error: ' + err.message);
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id) {
        if (!confirm('Delete this vendor?')) return;
        try {
            await api.deleteVendor(id);
            setVendors(vendors.filter(v => v.id !== id));
        } catch (err) {
            alert('Failed to delete');
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 bg-white rounded-full"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-display text-slate-900">Vendors</h1>
                    <p className="text-slate-600 mt-1">Manage your vendor database and contacts</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="btn-primary flex items-center"
                >
                    {showForm ? 'Cancel' : (
                        <>
                            <span className="mr-2">+</span>
                            Add Vendor
                        </>
                    )}
                </button>
            </div>

            {/* Add Form */}
            {showForm && (
                <div className="card animate-float" style={{ animation: 'none', animationDuration: '0s' }}>
                    <h2 className="text-lg font-bold text-slate-900 mb-6 font-display">New Vendor</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="input"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Email *</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="input"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                                <input
                                    type="text"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="input"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Company</label>
                                <input
                                    type="text"
                                    value={formData.company}
                                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                    className="input"
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button
                                type="submit"
                                disabled={saving}
                                className="btn-primary bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30 hover:shadow-emerald-500/40"
                            >
                                {saving ? 'Saving...' : 'Save Vendor'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Vendor Table */}
            <div className="card p-0 overflow-hidden">
                {vendors.length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
                            👥
                        </div>
                        <p className="text-slate-500 mb-6">No vendors added yet</p>
                        <button onClick={() => setShowForm(true)} className="text-primary-600 hover:text-primary-700 font-semibold hover:underline">
                            Add your first vendor
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-8 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                                    <th className="px-8 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                                    <th className="px-8 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact Info</th>
                                    <th className="px-8 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {vendors.map((vendor) => (
                                    <tr key={vendor.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-8 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-bold mr-3">
                                                    {vendor.name.charAt(0)}
                                                </div>
                                                <div className="font-medium text-slate-900">{vendor.name}</div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-4 whitespace-nowrap text-slate-600">{vendor.email}</td>
                                        <td className="px-8 py-4 whitespace-nowrap text-slate-500 text-sm">
                                            {vendor.contact_info?.phone || vendor.contact_info?.company || '-'}
                                        </td>
                                        <td className="px-8 py-4 whitespace-nowrap text-right">
                                            <button
                                                onClick={() => handleDelete(vendor.id)}
                                                className="text-slate-400 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-lg"
                                                title="Delete Vendor"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
