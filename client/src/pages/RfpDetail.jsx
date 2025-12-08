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
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!rfp) {
        return <div className="text-center py-12 text-gray-500">RFP not found</div>;
    }

    const statusColors = {
        draft: 'bg-gray-100 text-gray-700',
        sent: 'bg-blue-100 text-blue-700',
        active: 'bg-green-100 text-green-700',
        closed: 'bg-purple-100 text-purple-700'
    };

    return (
        <div>
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <Link to="/" className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block">← Back to Dashboard</Link>
                    <h1 className="text-3xl font-bold text-gray-900">{rfp.title}</h1>
                    <div className="flex items-center gap-3 mt-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[rfp.status]}`}>
                            {rfp.status}
                        </span>
                        {rfp.budget && (
                            <span className="text-gray-600">Budget: ${Number(rfp.budget).toLocaleString()}</span>
                        )}
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleRefreshProposals}
                        disabled={refreshing}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
                    >
                        {refreshing ? '⏳ Checking emails...' : '📥 Refresh Proposals'}
                    </button>
                    <button
                        onClick={() => setShowVendorModal(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        📧 Send to Vendors
                    </button>
                </div>
            </div>

            {/* RFP Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Requirements</h2>
                {rfp.structured_json_data?.lineItems?.length > 0 ? (
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Specs</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {rfp.structured_json_data.lineItems.map((item, i) => (
                                <tr key={i}>
                                    <td className="px-4 py-3 font-medium text-gray-900">{item.item}</td>
                                    <td className="px-4 py-3 text-gray-600">{item.quantity}</td>
                                    <td className="px-4 py-3 text-gray-600">{item.specs}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-gray-500">No line items specified</p>
                )}
                {rfp.structured_json_data?.deliveryDate && (
                    <p className="mt-4 text-sm text-gray-600"><strong>Delivery:</strong> {rfp.structured_json_data.deliveryDate}</p>
                )}
                {rfp.structured_json_data?.paymentTerms && (
                    <p className="text-sm text-gray-600"><strong>Payment Terms:</strong> {rfp.structured_json_data.paymentTerms}</p>
                )}
            </div>

            {/* AI Recommendation */}
            {comparison?.recommendedVendorName && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 mb-6">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">🏆</div>
                        <div>
                            <h3 className="text-lg font-semibold text-green-800">AI Recommendation</h3>
                            <p className="text-green-700 font-medium mt-1">{comparison.recommendedVendorName}</p>
                            <p className="text-green-600 mt-2">{comparison.summary}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Proposals Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900">Proposals ({proposals.length})</h2>
                    {proposals.length >= 2 && (
                        <button
                            onClick={handleCompare}
                            disabled={comparing}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm"
                        >
                            {comparing ? 'Comparing...' : '⚡ AI Compare'}
                        </button>
                    )}
                </div>

                {proposals.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        No proposals received yet. Send the RFP to vendors and wait for responses.
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delivery</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Warranty</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Score</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {proposals.map((proposal) => {
                                const scoreInfo = comparison?.scores?.find(s => s.proposalId === proposal.id);
                                const isRecommended = comparison?.recommendedProposalId === proposal.id;
                                return (
                                    <tr key={proposal.id} className={isRecommended ? 'bg-green-50' : 'hover:bg-gray-50'}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {isRecommended && <span className="text-lg">🏆</span>}
                                                <div>
                                                    <div className="font-medium text-gray-900">{proposal.vendor?.name || 'Unknown'}</div>
                                                    <div className="text-sm text-gray-500">{proposal.vendor?.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-900 font-medium">
                                            {proposal.extracted_data_json?.total_price
                                                ? `$${Number(proposal.extracted_data_json.total_price).toLocaleString()}`
                                                : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {proposal.extracted_data_json?.delivery_time || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 text-sm">
                                            {proposal.extracted_data_json?.warranty_terms || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {(proposal.score || scoreInfo?.score) ? (
                                                <span className={`inline-flex items-center justify-center w-12 h-12 rounded-full text-lg font-bold ${(proposal.score || scoreInfo?.score) >= 70 ? 'bg-green-100 text-green-700' :
                                                    (proposal.score || scoreInfo?.score) >= 40 ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
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
                )}
            </div>

            {/* Comparison Notes */}
            {comparison?.comparisonNotes && (
                <div className="bg-gray-50 rounded-xl p-6 mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">AI Analysis Notes</h3>
                    <p className="text-gray-600">{comparison.comparisonNotes}</p>
                </div>
            )}

            {/* Send to Vendors Modal */}
            {showVendorModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Vendors</h2>
                        <div className="max-h-64 overflow-y-auto space-y-2 mb-4">
                            {vendors.length === 0 ? (
                                <p className="text-gray-500 text-center py-4">No vendors added yet</p>
                            ) : (
                                vendors.map((vendor) => (
                                    <label key={vendor.id} className="flex items-center p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
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
                                            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <div className="ml-3">
                                            <div className="font-medium text-gray-900">{vendor.name}</div>
                                            <div className="text-sm text-gray-500">{vendor.email}</div>
                                        </div>
                                    </label>
                                ))
                            )}
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowVendorModal(false)}
                                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSendToVendors}
                                disabled={sending || selectedVendors.length === 0}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
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
