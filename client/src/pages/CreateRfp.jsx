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
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New RFP</h1>
            <p className="text-gray-600 mb-8">Describe your requirements in natural language and let AI structure them for you.</p>

            {/* Natural Language Input */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Describe your requirements
                </label>
                <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Example: I need 100 Dell laptops with 16GB RAM and 512GB SSD for our sales team. Budget is around $150,000. We need them delivered within 30 days with a 3-year warranty..."
                    className="w-full h-40 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
                <button
                    onClick={handleGenerate}
                    disabled={generating || !query.trim()}
                    className="mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center"
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
                        <>✨ Generate Structure</>
                    )}
                </button>
            </div>

            {/* Generated/Editable Form */}
            {generatedData && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-gray-900">Review & Edit</h2>
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">AI Generated</span>
                    </div>

                    <div className="space-y-6">
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                            <input
                                type="text"
                                value={editableData.title}
                                onChange={(e) => setEditableData({ ...editableData, title: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        {/* Budget & Delivery */}
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Budget ($)</label>
                                <input
                                    type="number"
                                    value={editableData.budget}
                                    onChange={(e) => setEditableData({ ...editableData, budget: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Date</label>
                                <input
                                    type="text"
                                    value={editableData.deliveryDate}
                                    onChange={(e) => setEditableData({ ...editableData, deliveryDate: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        {/* Payment Terms */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Terms</label>
                            <input
                                type="text"
                                value={editableData.paymentTerms}
                                onChange={(e) => setEditableData({ ...editableData, paymentTerms: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        {/* Line Items */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="block text-sm font-medium text-gray-700">Line Items</label>
                                <button onClick={addLineItem} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                                    + Add Item
                                </button>
                            </div>
                            <div className="space-y-3">
                                {editableData.lineItems.map((item, index) => (
                                    <div key={index} className="flex gap-3 items-start p-4 bg-gray-50 rounded-lg">
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                placeholder="Item name"
                                                value={item.item}
                                                onChange={(e) => updateLineItem(index, 'item', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2"
                                            />
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Quantity"
                                                    value={item.quantity}
                                                    onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                                                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Specifications"
                                                    value={item.specs}
                                                    onChange={(e) => updateLineItem(index, 'specs', e.target.value)}
                                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                />
                                            </div>
                                        </div>
                                        <button onClick={() => removeLineItem(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="pt-4 border-t border-gray-100">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
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
