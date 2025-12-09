import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

export default function Dashboard() {
    const [rfps, setRfps] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);

    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [rfpRes, vendorRes] = await Promise.all([
                api.getRfps(),
                api.getVendors()
            ]);
            if (rfpRes.success) setRfps(rfpRes.data);
            if (vendorRes.success) setVendors(vendorRes.data);
        } catch (err) {
            console.error('Failed to load data:', err);
        } finally {
            setLoading(false);
        }
    }

    async function handleRefresh() {
        if (refreshing) return;
        setRefreshing(true);
        try {
            const result = await api.refreshProposals();
            if (result.success) {
                alert(`Refreshed! Processed: ${result.processed}, Created: ${result.created}`);
                loadData(); // Reload data to show new proposals/status
            } else {
                alert('Failed to refresh: ' + (result.error || 'Unknown error'));
            }
        } catch (err) {
            alert('Error: ' + err.message);
        } finally {
            setRefreshing(false);
        }
    }

    const statusColors = {
        draft: 'bg-slate-100 text-slate-700 border-slate-200',
        sent: 'bg-blue-50 text-blue-700 border-blue-200',
        active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        closed: 'bg-purple-50 text-purple-700 border-purple-200'
    };

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
        <div className="space-y-10">
            {/* Hero */}
            <div className="text-center max-w-3xl mx-auto py-8">
                <h1 className="text-5xl font-bold font-display text-slate-900 mb-6 tracking-tight leading-tight">
                    AI-Powered <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-blue-600">RFP Management</span>
                </h1>
                <p className="text-xl text-slate-600 leading-relaxed">Streamline your procurement process with intelligent proposal management and automated vendor interactions.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Total RFPs', value: rfps.length, icon: '📄', color: 'bg-blue-50 text-blue-600' },
                    { label: 'Active', value: rfps.filter(r => r.status === 'sent').length, icon: '🚀', color: 'bg-emerald-50 text-emerald-600' },
                    { label: 'Vendors', value: vendors.length, icon: '🏢', color: 'bg-purple-50 text-purple-600' },
                    { label: 'Drafts', value: rfps.filter(r => r.status === 'draft').length, icon: '📝', color: 'bg-amber-50 text-amber-600' }
                ].map((stat, i) => (
                    <div key={i} className="card group hover:-translate-y-1">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`w-12 h-12 rounded-2xl ${stat.color} flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300`}>
                                {stat.icon}
                            </div>
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Stat</span>
                        </div>
                        <div>
                            <p className="text-4xl font-bold text-slate-900 font-display">{stat.value}</p>
                            <p className="text-sm font-medium text-slate-500 mt-1">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link to="/rfps/create" className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 p-8 text-white shadow-lg shadow-primary-500/30 hover:shadow-primary-500/40 transition-all duration-300 hover:-translate-y-1">
                    <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="relative z-10">
                        <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 text-3xl">
                            ✨
                        </div>
                        <h3 className="text-2xl font-bold mb-2 font-display">Create New RFP</h3>
                        <p className="text-primary-100">Use AI to structure your requirements and generate proposals instantly.</p>
                    </div>
                </Link>

                <Link to="/vendors" className="card group hover:border-blue-200">
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 text-3xl group-hover:scale-110 transition-transform duration-300">
                        🏢
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Manage Vendors</h3>
                    <p className="text-slate-500">Add and organize your vendor list to streamline communication.</p>
                </Link>

                <div
                    className={`card group hover:border-purple-200 cursor-pointer ${refreshing ? 'opacity-75 pointer-events-none' : ''}`}
                    onClick={handleRefresh}
                >
                    <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mb-6 text-3xl group-hover:scale-110 transition-transform duration-300">
                        {refreshing ? (
                            <svg className="animate-spin h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : '📥'}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                        {refreshing ? 'Checking Emails...' : 'Fetch Proposals'}
                    </h3>
                    <p className="text-slate-500">Check for new vendor responses and update proposal statuses.</p>
                </div>
            </div>

            {/* RFP List */}
            <div className="card p-0 overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h2 className="text-xl font-bold text-slate-900 font-display">Recent RFPs</h2>
                    <Link to="/rfps/create" className="text-primary-600 hover:text-primary-700 text-sm font-semibold hover:underline">
                        View All RFPs →
                    </Link>
                </div>

                {rfps.length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
                            📭
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">No RFPs yet</h3>
                        <p className="text-slate-500 mb-8 max-w-sm mx-auto">Get started by creating your first Request for Proposal using our AI-powered tools.</p>
                        <Link to="/rfps/create" className="btn-primary inline-flex items-center">
                            Create your first RFP
                        </Link>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {rfps.map((rfp) => (
                            <Link key={rfp.id} to={`/rfps/${rfp.id}`} className="block px-8 py-5 hover:bg-slate-50 transition-colors group">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-lg group-hover:bg-white group-hover:shadow-sm transition-all">
                                            📄
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-900 group-hover:text-primary-600 transition-colors">{rfp.title}</h3>
                                            <p className="text-sm text-slate-500 mt-0.5">
                                                Budget: <span className="font-medium text-slate-700">{rfp.budget ? `$${Number(rfp.budget).toLocaleString()}` : 'TBD'}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-6">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[rfp.status] || statusColors.draft}`}>
                                            {rfp.status.toUpperCase()}
                                        </span>
                                        <svg className="w-5 h-5 text-slate-300 group-hover:text-primary-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
