import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

export default function Dashboard() {
    const [rfps, setRfps] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);

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

    const statusColors = {
        draft: 'bg-gray-100 text-gray-700',
        sent: 'bg-blue-100 text-blue-700',
        active: 'bg-green-100 text-green-700',
        closed: 'bg-purple-100 text-purple-700'
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div>
            {/* Hero */}
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-gray-900 mb-3">
                    AI-Powered <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">RFP Management</span>
                </h1>
                <p className="text-lg text-gray-600">Streamline procurement with intelligent proposal management</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                {[
                    { label: 'Total RFPs', value: rfps.length, icon: '📄', color: 'from-blue-500 to-blue-600' },
                    { label: 'Active', value: rfps.filter(r => r.status === 'sent').length, icon: '🚀', color: 'from-green-500 to-green-600' },
                    { label: 'Vendors', value: vendors.length, icon: '🏢', color: 'from-purple-500 to-purple-600' },
                    { label: 'Drafts', value: rfps.filter(r => r.status === 'draft').length, icon: '📝', color: 'from-amber-500 to-amber-600' }
                ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                            </div>
                            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-2xl`}>
                                {stat.icon}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <Link to="/rfps/create" className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-blue-200 transition-all group">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                        <span className="text-2xl">➕</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Create New RFP</h3>
                    <p className="text-gray-600 text-sm">Use AI to structure your requirements</p>
                </Link>

                <Link to="/vendors" className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-green-200 transition-all group">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                        <span className="text-2xl">🏢</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Vendors</h3>
                    <p className="text-gray-600 text-sm">Add and organize your vendor list</p>
                </Link>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-purple-200 transition-all group cursor-pointer" onClick={() => api.refreshProposals()}>
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                        <span className="text-2xl">📥</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Fetch Proposals</h3>
                    <p className="text-gray-600 text-sm">Check for new vendor responses</p>
                </div>
            </div>

            {/* RFP List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900">Recent RFPs</h2>
                    <Link to="/rfps/create" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                        + New RFP
                    </Link>
                </div>

                {rfps.length === 0 ? (
                    <div className="p-12 text-center">
                        <p className="text-gray-500 mb-4">No RFPs created yet</p>
                        <Link to="/rfps/create" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            Create your first RFP
                        </Link>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {rfps.map((rfp) => (
                            <Link key={rfp.id} to={`/rfps/${rfp.id}`} className="block px-6 py-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-medium text-gray-900">{rfp.title}</h3>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Budget: {rfp.budget ? `$${Number(rfp.budget).toLocaleString()}` : 'TBD'}
                                        </p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[rfp.status] || statusColors.draft}`}>
                                        {rfp.status}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
