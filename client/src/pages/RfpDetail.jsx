import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';

export default function RfpDetail() {
    const { id } = useParams();
    const [rfp, setRfp] = useState(null);
    const [proposals, setProposals] = useState([]);
    const [comparison, setComparison] = useState(null);
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showVendorModal, setShowVendorModal] = useState(false);
    const [selectedVendors, setSelectedVendors] = useState([]);
    const [sending, setSending] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [refreshStatus, setRefreshStatus] = useState(null);
    const [comparing, setComparing] = useState(false);

    useEffect(() => {
        loadData();
    }, [id]);

    async function loadData() {
        try {
            const [rfpRes, vendorRes] = await Promise.all([
                api.getRfp(id),
                api.getVendors()
            ]);
            if (rfpRes.success) setRfp(rfpRes.data);
            if (vendorRes.success) setVendors(vendorRes.data);

            // Load proposals
            const proposalRes = await api.getProposals(id);
            if (proposalRes.success) setProposals(proposalRes.data);
        } catch (err) {
            console.error('Failed to load:', err);
        } finally {
            setLoading(false);
        }
    }

    async function handleSendToVendors() {
        if (selectedVendors.length === 0) {
            alert('Select at least one vendor');
            return;
        }
        setSending(true);
        try {
            const result = await api.sendRfpToVendors(id, selectedVendors);
            if (result.success) {
                alert(`Sent to ${result.totalSent || selectedVendors.length} vendor(s)`);
                setShowVendorModal(false);
                setSelectedVendors([]);
                loadData();
            } else {
                alert('Failed: ' + (result.error || 'Unknown error'));
            }
        } catch (err) {
            alert('Error: ' + err.message);
        } finally {
            setSending(false);
        }
    }

    async function handleRefreshProposals() {
        setRefreshing(true);
        try {
            const result = await api.refreshProposals();
            if (result.success) {
                alert(`Done! Processed: ${result.processed}, Created: ${result.created}`);
                loadData();
            } else {
                alert('Error: ' + (result.error || result.message));
            }
        } catch (err) {
            alert('Error: ' + err.message);
        } finally {
            setRefreshing(false);
        }
    }

    async function handleCompare() {
        setComparing(true);
        try {
            const result = await api.compareProposals(id);
            if (result.success) {
                setComparison(result.comparison);
                if (result.proposals) setProposals(result.proposals);
            }
        } catch (err) {
            alert('Error: ' + err.message);
        } finally {
            setComparing(false);
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

    if (!rfp) {
        return <div className="text-center py-12 text-slate-500">RFP not found</div>;
    }

    const statusColors = {
        draft: 'bg-slate-100 text-slate-700 border-slate-200',
        sent: 'bg-blue-50 text-blue-700 border-blue-200',
        active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        closed: 'bg-purple-50 text-purple-700 border-purple-200'
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <Link to="/" className="text-primary-600 hover:text-primary-700 text-sm mb-2 inline-flex items-center font-medium hover:underline">
                        <span className="mr-1">←</span> Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold font-display text-slate-900 mt-1">{rfp.title}</h1>
                    <div className="flex items-center gap-3 mt-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${statusColors[rfp.status]}`}>
                            {rfp.status.toUpperCase()}
                        </span>
                        {rfp.budget && (
                            <span className="text-slate-600 font-medium">Budget: <span className="text-slate-900">${Number(rfp.budget).toLocaleString()}</span></span>
                        )}
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleRefreshProposals}
                        disabled={refreshing}
                        className="btn-secondary flex items-center"
                    >
                        {refreshing ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-600" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Checking emails...
                            </>
                        ) : (
                            <>
                                <span className="mr-2">📥</span>
                                Refresh Proposals
                            </>
                        )}
                    </button>
                    <button
                        onClick={() => setShowVendorModal(true)}
                        className="btn-primary flex items-center"
                    >
                        <span className="mr-2">📧</span>
                        Send to Vendors
                    </button>
                </div>
            </div>

            {/* RFP Details */}
            <div className="card">
                <h2 className="text-lg font-bold text-slate-900 mb-6 font-display">Requirements</h2>
                {rfp.structured_json_data?.lineItems?.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-slate-100">
                        <table className="w-full">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Item</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Quantity</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Specs</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {rfp.structured_json_data.lineItems.map((item, i) => (
                                    <tr key={i}>
                                        <td className="px-6 py-4 font-medium text-slate-900">{item.item}</td>
                                        <td className="px-6 py-4 text-slate-600">{item.quantity}</td>
                                        <td className="px-6 py-4 text-slate-600">{item.specs}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-slate-500 italic">No line items specified</p>
                )}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {rfp.structured_json_data?.deliveryDate && (
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-sm text-slate-500 mb-1">Delivery Required By</p>
                            <p className="font-semibold text-slate-900">{rfp.structured_json_data.deliveryDate}</p>
                        </div>
                    )}
                    {rfp.structured_json_data?.paymentTerms && (
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-sm text-slate-500 mb-1">Payment Terms</p>
                            <p className="font-semibold text-slate-900">{rfp.structured_json_data.paymentTerms}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* AI Recommendation */}
            {comparison?.recommendedVendorName && (
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 p-8 shadow-sm">
                    <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-emerald-100 rounded-full blur-2xl opacity-50"></div>
                    <div className="relative z-10 flex items-start gap-6">
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-3xl ring-4 ring-emerald-50">🏆</div>
                        <div>
                            <h3 className="text-xl font-bold text-emerald-900 font-display">AI Recommendation</h3>
                            <p className="text-emerald-800 font-semibold mt-1 text-lg">{comparison.recommendedVendorName}</p>
                            <p className="text-emerald-700 mt-3 leading-relaxed max-w-3xl">{comparison.summary}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Proposals Section */}
            <div className="card p-0 overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h2 className="text-lg font-bold text-slate-900 font-display">Proposals ({proposals.length})</h2>
                    {proposals.length >= 2 && (
                        <button
                            onClick={handleCompare}
                            disabled={comparing}
                            className="btn-primary bg-violet-600 hover:bg-violet-700 shadow-violet-500/30 hover:shadow-violet-500/40 py-2 px-4 text-sm flex items-center"
                        >
                            {comparing ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <span className="mr-2">⚡</span>
                                    AI Compare
                                </>
                            )}
                        </button>
                    )}
                </div>

                {proposals.length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                            📫
                        </div>
                        <p className="text-slate-500">No proposals received yet.</p>
                        <p className="text-sm text-slate-400 mt-1">Send the RFP to vendors and wait for responses.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Vendor</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Price</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Delivery</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Warranty</th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Score</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {proposals.map((proposal) => {
                                    const scoreInfo = comparison?.scores?.find(s => s.proposalId === proposal.id);
                                    const isRecommended = comparison?.recommendedProposalId === proposal.id;
                                    return (
                                        <tr key={proposal.id} className={`transition-colors ${isRecommended ? 'bg-emerald-50/50' : 'hover:bg-slate-50'}`}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {isRecommended && <span className="text-xl" title="Recommended">🏆</span>}
                                                    <div>
                                                        <div className="font-semibold text-slate-900">{proposal.vendor?.name || 'Unknown'}</div>
                                                        <div className="text-sm text-slate-500">{proposal.vendor?.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-900 font-medium">
                                                {proposal.extracted_data_json?.total_price
                                                    ? `$${Number(proposal.extracted_data_json.total_price).toLocaleString()}`
                                                    : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {proposal.extracted_data_json?.delivery_time || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 text-sm">
                                                {proposal.extracted_data_json?.warranty_terms || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {(proposal.score || scoreInfo?.score) ? (
                                                    <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold shadow-sm ${(proposal.score || scoreInfo?.score) >= 70 ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500/20' :
                                                        (proposal.score || scoreInfo?.score) >= 40 ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-500/20' :
                                                            'bg-red-100 text-red-700 ring-2 ring-red-500/20'
                                                        }`}>
                                                        {Math.round(proposal.score || scoreInfo?.score)}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Comparison Notes */}
            {comparison?.comparisonNotes && (
                <div className="card bg-slate-50 border-slate-200">
                    <h3 className="text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">AI Analysis Notes</h3>
                    <p className="text-slate-600 leading-relaxed">{comparison.comparisonNotes}</p>
                </div>
            )}

            {/* Send to Vendors Modal */}
            {showVendorModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-float" style={{ animation: 'none', animationDuration: '0s' }}>
                        <h2 className="text-xl font-bold text-slate-900 mb-4 font-display">Select Vendors</h2>
                        <div className="max-h-80 overflow-y-auto space-y-2 mb-6 pr-2 custom-scrollbar">
                            {vendors.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-slate-500 mb-2">No vendors added yet</p>
                                    <Link to="/vendors" className="text-primary-600 hover:text-primary-700 font-medium text-sm">Manage Vendors</Link>
                                </div>
                            ) : (
                                vendors.map((vendor) => (
                                    <label key={vendor.id} className="flex items-center p-3 rounded-xl hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-100 transition-all">
                                        <input
                                            type="checkbox"
                                            checked={selectedVendors.includes(vendor.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedVendors([...selectedVendors, vendor.id]);
                                                } else {
                                                    setSelectedVendors(selectedVendors.filter(id => id !== vendor.id));
                                                }
                                            }}
                                            className="w-5 h-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                        />
                                        <div className="ml-3">
                                            <div className="font-medium text-slate-900">{vendor.name}</div>
                                            <div className="text-sm text-slate-500">{vendor.email}</div>
                                        </div>
                                    </label>
                                ))
                            )}
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowVendorModal(false)}
                                className="flex-1 btn-secondary justify-center"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSendToVendors}
                                disabled={sending || selectedVendors.length === 0}
                                className="flex-1 btn-primary justify-center disabled:opacity-50 disabled:shadow-none"
                            >
                                {sending ? 'Sending...' : `Send (${selectedVendors.length})`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
