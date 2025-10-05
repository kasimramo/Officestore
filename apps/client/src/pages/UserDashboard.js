import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
export default function UserDashboard() {
    const [activeTab, setActiveTab] = useState('requests');
    const [showNewRequest, setShowNewRequest] = useState(false);
    // Mock data - in real app this would come from API based on user's site/area access
    const [requests] = useState([
        {
            id: '1',
            items: [
                { name: 'Coffee Pods', quantity: 50, unit: 'pieces' },
                { name: 'Paper Towels', quantity: 10, unit: 'rolls' }
            ],
            status: 'PENDING',
            priority: 'MEDIUM',
            requestedDate: '2024-01-28',
            notes: 'Kitchen supplies running low'
        },
        {
            id: '2',
            items: [
                { name: 'Printer Paper', quantity: 5, unit: 'reams' }
            ],
            status: 'FULFILLED',
            priority: 'LOW',
            requestedDate: '2024-01-25'
        }
    ]);
    const [stockItems] = useState([
        {
            id: '1',
            name: 'Coffee Pods',
            category: 'Pantry',
            currentStock: 25,
            unit: 'pieces',
            minStock: 50,
            lastUpdated: '2024-01-27'
        },
        {
            id: '2',
            name: 'Paper Towels',
            category: 'Cleaning',
            currentStock: 8,
            unit: 'rolls',
            minStock: 12,
            lastUpdated: '2024-01-26'
        },
        {
            id: '3',
            name: 'Printer Paper',
            category: 'Office Supplies',
            currentStock: 15,
            unit: 'reams',
            minStock: 10,
            lastUpdated: '2024-01-28'
        }
    ]);
    const lowStockItems = stockItems.filter(item => item.currentStock <= item.minStock);
    const pendingRequests = requests.filter(req => req.status === 'PENDING');
    return (_jsxs("div", { className: "bg-slate-50", children: [_jsxs("div", { className: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6 mb-8", children: [_jsx("div", { className: "bg-white rounded-lg border border-slate-200 p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-slate-600", children: "Pending Requests" }), _jsx("p", { className: "text-2xl font-bold text-orange-600", children: pendingRequests.length })] }), _jsx("div", { className: "text-orange-500", children: _jsx("svg", { className: "w-8 h-8", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" }) }) })] }) }), _jsx("div", { className: "bg-white rounded-lg border border-slate-200 p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-slate-600", children: "Low Stock Alerts" }), _jsx("p", { className: "text-2xl font-bold text-red-600", children: lowStockItems.length })] }), _jsx("div", { className: "text-red-500", children: _jsx("svg", { className: "w-8 h-8", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" }) }) })] }) }), _jsx("div", { className: "bg-white rounded-lg border border-slate-200 p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-slate-600", children: "Total Requests" }), _jsx("p", { className: "text-2xl font-bold text-blue-600", children: requests.length })] }), _jsx("div", { className: "text-blue-500", children: _jsx("svg", { className: "w-8 h-8", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" }) }) })] }) })] }), _jsxs("div", { className: "bg-white rounded-lg border border-slate-200 overflow-hidden mb-6", children: [_jsxs("div", { className: "flex border-b border-slate-200", children: [_jsx("button", { onClick: () => setActiveTab('requests'), className: `flex-1 px-6 py-4 text-sm font-medium ${activeTab === 'requests'
                                            ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                                            : 'text-slate-500 hover:text-slate-700'}`, children: "My Requests" }), _jsx("button", { onClick: () => setActiveTab('stock'), className: `flex-1 px-6 py-4 text-sm font-medium ${activeTab === 'stock'
                                            ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                                            : 'text-slate-500 hover:text-slate-700'}`, children: "Stock Levels" })] }), activeTab === 'requests' && (_jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsx("h3", { className: "text-lg font-semibold text-slate-900", children: "My Requests" }), _jsx("button", { onClick: () => setShowNewRequest(true), className: "bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors", children: "New Request" })] }), _jsx("div", { className: "space-y-4", children: requests.map((request) => (_jsx("div", { className: "border border-slate-200 rounded-lg p-4", children: _jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx("span", { className: `inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`, children: request.status }), _jsx("span", { className: `inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(request.priority)}`, children: request.priority })] }), _jsx("div", { className: "space-y-1", children: request.items.map((item, index) => (_jsxs("div", { className: "text-sm text-slate-700", children: [item.quantity, " ", item.unit, " of ", item.name] }, index))) }), request.notes && (_jsxs("p", { className: "text-sm text-slate-600 mt-2", children: ["Note: ", request.notes] }))] }), _jsx("div", { className: "text-right text-sm text-slate-500", children: new Date(request.requestedDate).toLocaleDateString() })] }) }, request.id))) })] })), activeTab === 'stock' && (_jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsx("h3", { className: "text-lg font-semibold text-slate-900", children: "Stock Levels" }), _jsxs("div", { className: "text-sm text-slate-600", children: ["Last updated: ", new Date().toLocaleDateString()] })] }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { className: "bg-slate-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider", children: "Item" }), _jsx("th", { className: "px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider", children: "Category" }), _jsx("th", { className: "px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider", children: "Current Stock" }), _jsx("th", { className: "px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider", children: "Min Stock" }), _jsx("th", { className: "px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider", children: "Status" }), _jsx("th", { className: "px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider", children: "Actions" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-slate-200", children: stockItems.map((item) => (_jsxs("tr", { className: "hover:bg-slate-50", children: [_jsx("td", { className: "px-4 py-4 text-sm font-medium text-slate-900", children: item.name }), _jsx("td", { className: "px-4 py-4 text-sm text-slate-500", children: item.category }), _jsxs("td", { className: "px-4 py-4 text-sm text-slate-900", children: [item.currentStock, " ", item.unit] }), _jsxs("td", { className: "px-4 py-4 text-sm text-slate-500", children: [item.minStock, " ", item.unit] }), _jsx("td", { className: "px-4 py-4", children: item.currentStock <= item.minStock ? (_jsx("span", { className: "inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800", children: "Low Stock" })) : (_jsx("span", { className: "inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800", children: "In Stock" })) }), _jsxs("td", { className: "px-4 py-4 text-sm", children: [_jsx("button", { className: "text-blue-600 hover:text-blue-900 mr-2", children: "Update Count" }), item.currentStock <= item.minStock && (_jsx("button", { className: "text-orange-600 hover:text-orange-900", children: "Request More" }))] })] }, item.id))) })] }) })] }))] })] }), showNewRequest && (_jsx(NewRequestModal, { onClose: () => setShowNewRequest(false) }))] }));
}
function getStatusColor(status) {
    switch (status) {
        case 'PENDING':
            return 'bg-orange-100 text-orange-800';
        case 'APPROVED':
            return 'bg-blue-100 text-blue-800';
        case 'FULFILLED':
            return 'bg-green-100 text-green-800';
        case 'REJECTED':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}
function getPriorityColor(priority) {
    switch (priority) {
        case 'HIGH':
            return 'bg-red-100 text-red-800';
        case 'MEDIUM':
            return 'bg-yellow-100 text-yellow-800';
        case 'LOW':
            return 'bg-green-100 text-green-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}
function NewRequestModal({ onClose }) {
    const [formData, setFormData] = useState({
        items: [{ name: '', quantity: 1, unit: '' }],
        priority: 'MEDIUM',
        notes: ''
    });
    const availableItems = [
        { name: 'Coffee Pods', unit: 'pieces' },
        { name: 'Paper Towels', unit: 'rolls' },
        { name: 'Printer Paper', unit: 'reams' },
        { name: 'Cleaning Supplies', unit: 'bottles' },
        { name: 'Pens', unit: 'pieces' }
    ];
    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { name: '', quantity: 1, unit: '' }]
        });
    };
    const removeItem = (index) => {
        setFormData({
            ...formData,
            items: formData.items.filter((_, i) => i !== index)
        });
    };
    const updateItem = (index, field, value) => {
        const updatedItems = formData.items.map((item, i) => i === index ? { ...item, [field]: value } : item);
        setFormData({ ...formData, items: updatedItems });
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        // Handle request submission
        console.log('New request:', formData);
        onClose();
    };
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50", children: _jsx("div", { className: "bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto", children: _jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsx("h3", { className: "text-lg font-semibold text-slate-900", children: "New Request" }), _jsx("button", { onClick: onClose, className: "text-slate-400 hover:text-slate-600", children: _jsx("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) }) })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-2", children: "Items Requested" }), formData.items.map((item, index) => (_jsxs("div", { className: "flex gap-2 mb-2", children: [_jsxs("select", { value: item.name, onChange: (e) => {
                                                    const selectedItem = availableItems.find(ai => ai.name === e.target.value);
                                                    updateItem(index, 'name', e.target.value);
                                                    if (selectedItem) {
                                                        updateItem(index, 'unit', selectedItem.unit);
                                                    }
                                                }, className: "flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "", children: "Select item" }), availableItems.map(ai => (_jsx("option", { value: ai.name, children: ai.name }, ai.name)))] }), _jsx("input", { type: "number", value: item.quantity, onChange: (e) => updateItem(index, 'quantity', parseInt(e.target.value)), min: "1", className: "w-20 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" }), _jsx("input", { type: "text", value: item.unit, readOnly: true, className: "w-20 px-3 py-2 border border-slate-300 rounded-md text-sm bg-slate-50" }), formData.items.length > 1 && (_jsx("button", { type: "button", onClick: () => removeItem(index), className: "text-red-600 hover:text-red-800", children: _jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" }) }) }))] }, index))), _jsx("button", { type: "button", onClick: addItem, className: "text-blue-600 hover:text-blue-800 text-sm", children: "+ Add another item" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Priority" }), _jsxs("select", { value: formData.priority, onChange: (e) => setFormData({ ...formData, priority: e.target.value }), className: "w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "LOW", children: "Low - When convenient" }), _jsx("option", { value: "MEDIUM", children: "Medium - Within a week" }), _jsx("option", { value: "HIGH", children: "High - Urgent" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Notes (Optional)" }), _jsx("textarea", { value: formData.notes, onChange: (e) => setFormData({ ...formData, notes: e.target.value }), placeholder: "Any additional information about this request", rows: 3, className: "w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { className: "flex justify-end space-x-3 pt-4", children: [_jsx("button", { type: "button", onClick: onClose, className: "px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50", children: "Cancel" }), _jsx("button", { type: "submit", disabled: !formData.items[0].name, className: "px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed", children: "Submit Request" })] })] })] }) }) }));
}
