import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function CreateRfp() {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [generating, setGenerating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [generatedData, setGeneratedData] = useState(null);
    const [editableData, setEditableData] = useState({
        title: '',
        budget: '',
        deliveryDate: '',
        paymentTerms: '',
        lineItems: []
    });

    async function handleGenerate() {
        if (!query.trim()) return;
        setGenerating(true);
        try {
            const result = await api.generateRfp(query);
            if (result.success && result.data) {
                setGeneratedData(result.data);
                setEditableData({
                    title: result.data.title || '',
                    budget: result.data.budget || '',
                    deliveryDate: result.data.deliveryDate || '',
                    paymentTerms: result.data.paymentTerms || '',
                    lineItems: result.data.lineItems || []
                });
            } else {
                alert('Failed to generate: ' + (result.error || 'Unknown error'));
            }
        } catch (err) {
            alert('Error: ' + err.message);
        } finally {
            setGenerating(false);
        }
    }

    async function handleSave() {
        if (!editableData.title.trim()) {
            alert('Title is required');
            return;
        }
        setSaving(true);
        try {
            const result = await api.createRfp({
                title: editableData.title,
                naturalLanguageQuery: query,
                structuredData: {
                    lineItems: editableData.lineItems,
                    deliveryDate: editableData.deliveryDate,
                    paymentTerms: editableData.paymentTerms
                },
                budget: editableData.budget || null,
                status: 'draft'
            });
            if (result.success) {
                navigate(`/rfps/${result.data.id}`);
            } else {
                alert('Failed to save: ' + (result.error || 'Unknown error'));
            }
        } catch (err) {
            alert('Error: ' + err.message);
        } finally {
            setSaving(false);
        }
    }

    function updateLineItem(index, field, value) {
        const updated = [...editableData.lineItems];
        updated[index] = { ...updated[index], [field]: value };
        setEditableData({ ...editableData, lineItems: updated });
    }

    function addLineItem() {
        setEditableData({
            ...editableData,
            lineItems: [...editableData.lineItems, { item: '', quantity: '', specs: '' }]
        });
    }

    function removeLineItem(index) {
        setEditableData({
            ...editableData,
            lineItems: editableData.lineItems.filter((_, i) => i !== index)
        });
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center">
                <h1 className="text-3xl font-bold font-display text-slate-900 mb-2">Create New RFP</h1>
                <p className="text-slate-600">Describe your requirements in natural language and let AI structure them for you.</p>
            </div>

            {/* Natural Language Input */}
            <div className="card">
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Describe your requirements
                </label>
                <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Example: I need 100 Dell laptops with 16GB RAM and 512GB SSD for our sales team. Budget is around $150,000. We need them delivered within 30 days with a 3-year warranty..."
                    className="input min-h-[160px] resize-none"
                />
                <div className="mt-4 flex justify-end">
                    <button
                        onClick={handleGenerate}
                        disabled={generating || !query.trim()}
                        className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {generating ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Generating with AI...
                            </>
                        ) : (
                            <>
                                <span className="mr-2">✨</span>
                                Generate Structure
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Generated/Editable Form */}
            {generatedData && (
                <div className="card animate-float" style={{ animation: 'none', animationDuration: '0s' }}>
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-bold text-slate-900 font-display">Review & Edit</h2>
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-sm font-medium flex items-center">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
                            AI Generated
                        </span>
                    </div>

                    <div className="space-y-6">
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                            <input
                                type="text"
                                value={editableData.title}
                                onChange={(e) => setEditableData({ ...editableData, title: e.target.value })}
                                className="input"
                            />
                        </div>

                        {/* Budget & Delivery */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Budget ($)</label>
                                <input
                                    type="number"
                                    value={editableData.budget}
                                    onChange={(e) => setEditableData({ ...editableData, budget: e.target.value })}
                                    className="input"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Delivery Date</label>
                                <input
                                    type="text"
                                    value={editableData.deliveryDate}
                                    onChange={(e) => setEditableData({ ...editableData, deliveryDate: e.target.value })}
                                    className="input"
                                />
                            </div>
                        </div>

                        {/* Payment Terms */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Payment Terms</label>
                            <input
                                type="text"
                                value={editableData.paymentTerms}
                                onChange={(e) => setEditableData({ ...editableData, paymentTerms: e.target.value })}
                                className="input"
                            />
                        </div>

                        {/* Line Items */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <label className="block text-sm font-medium text-slate-700">Line Items</label>
                                <button onClick={addLineItem} className="text-primary-600 hover:text-primary-700 text-sm font-semibold hover:underline">
                                    + Add Item
                                </button>
                            </div>
                            <div className="space-y-3">
                                {editableData.lineItems.map((item, index) => (
                                    <div key={index} className="flex gap-4 items-start p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="flex-1 space-y-3">
                                            <input
                                                type="text"
                                                placeholder="Item name"
                                                value={item.item}
                                                onChange={(e) => updateLineItem(index, 'item', e.target.value)}
                                                className="input py-2 text-sm"
                                            />
                                            <div className="flex gap-3">
                                                <input
                                                    type="text"
                                                    placeholder="Qty"
                                                    value={item.quantity}
                                                    onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                                                    className="input w-24 py-2 text-sm"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Specifications"
                                                    value={item.specs}
                                                    onChange={(e) => updateLineItem(index, 'specs', e.target.value)}
                                                    className="input flex-1 py-2 text-sm"
                                                />
                                            </div>
                                        </div>
                                        <button onClick={() => removeLineItem(index)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="pt-6 border-t border-slate-100">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full btn-primary bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30 hover:shadow-emerald-500/40"
                            >
                                {saving ? 'Saving...' : '💾 Save RFP'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
