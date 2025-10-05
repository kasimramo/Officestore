import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
export default function AdminUsers() {
    const { user, org } = useAuth();
    const [showCreateUser, setShowCreateUser] = useState(false);
    const [users, setUsers] = useState([
        {
            id: '1',
            username: 'john.staff',
            email: 'john@company.com',
            firstName: 'John',
            lastName: 'Smith',
            role: 'STAFF',
            sites: ['Site A'],
            areas: ['Kitchen', 'Office Supplies'],
            categories: ['Office Supplies', 'Pantry'],
            isActive: true,
            createdAt: '2024-01-15',
            lastLogin: '2024-01-28'
        },
        {
            id: '2',
            username: 'sarah.procurement',
            email: 'sarah@company.com',
            firstName: 'Sarah',
            lastName: 'Johnson',
            role: 'PROCUREMENT',
            sites: ['Site A', 'Site B'],
            areas: ['All Areas'],
            categories: ['All Categories'],
            isActive: true,
            createdAt: '2024-01-10',
            lastLogin: '2024-01-28'
        }
    ]);
    return (_jsxs("div", { className: "min-h-screen bg-slate-50", children: [_jsx("header", { className: "bg-white border-b border-slate-200", children: _jsx("div", { className: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "flex justify-between items-center py-6", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx(Link, { to: "/admin-dashboard", className: "text-slate-400 hover:text-slate-600", children: _jsx("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 19l-7-7 7-7" }) }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-xl font-bold text-slate-900", children: "User Management" }), _jsx("p", { className: "text-sm text-slate-600", children: org?.name })] })] }), _jsx("button", { onClick: () => setShowCreateUser(true), className: "bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors", children: "Create User" })] }) }) }), _jsxs("div", { className: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6 mb-8", children: [_jsxs("div", { className: "bg-white rounded-lg border border-slate-200 p-6", children: [_jsx("div", { className: "text-2xl font-bold text-slate-900", children: users.length }), _jsx("div", { className: "text-sm text-slate-600", children: "Total Users" })] }), _jsxs("div", { className: "bg-white rounded-lg border border-slate-200 p-6", children: [_jsx("div", { className: "text-2xl font-bold text-green-600", children: users.filter(u => u.isActive).length }), _jsx("div", { className: "text-sm text-slate-600", children: "Active Users" })] }), _jsxs("div", { className: "bg-white rounded-lg border border-slate-200 p-6", children: [_jsx("div", { className: "text-2xl font-bold text-blue-600", children: users.filter(u => u.role === 'STAFF').length }), _jsx("div", { className: "text-sm text-slate-600", children: "Staff Users" })] }), _jsxs("div", { className: "bg-white rounded-lg border border-slate-200 p-6", children: [_jsx("div", { className: "text-2xl font-bold text-purple-600", children: users.filter(u => u.role.includes('APPROVER')).length }), _jsx("div", { className: "text-sm text-slate-600", children: "Approvers" })] })] }), _jsxs("div", { className: "bg-white rounded-lg border border-slate-200 overflow-hidden", children: [_jsxs("div", { className: "px-6 py-4 border-b border-slate-200", children: [_jsx("h3", { className: "text-lg font-semibold text-slate-900", children: "End Users" }), _jsx("p", { className: "text-sm text-slate-600", children: "Users who can submit requests and update stock" })] }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { className: "bg-slate-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider", children: "User" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider", children: "Role" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider", children: "Access" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider", children: "Status" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider", children: "Last Login" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider", children: "Actions" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-slate-200", children: users.map((user) => (_jsxs("tr", { className: "hover:bg-slate-50", children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("div", { children: [_jsxs("div", { className: "text-sm font-medium text-slate-900", children: [user.firstName, " ", user.lastName] }), _jsxs("div", { className: "text-sm text-slate-500", children: ["@", user.username] }), user.email && _jsx("div", { className: "text-sm text-slate-500", children: user.email })] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("span", { className: `inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`, children: user.role }) }), _jsx("td", { className: "px-6 py-4", children: _jsxs("div", { className: "text-sm text-slate-900", children: [_jsxs("div", { children: ["Sites: ", user.sites.join(', ')] }), _jsxs("div", { children: ["Areas: ", user.areas.slice(0, 2).join(', '), user.areas.length > 2 ? '...' : ''] })] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("span", { className: `inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`, children: user.isActive ? 'Active' : 'Inactive' }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-slate-500", children: user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never' }), _jsxs("td", { className: "px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2", children: [_jsx("button", { className: "text-blue-600 hover:text-blue-900", children: "Edit" }), _jsx("button", { className: "text-red-600 hover:text-red-900", children: "Reset Password" }), _jsx("button", { className: user.isActive ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900', children: user.isActive ? 'Disable' : 'Enable' })] })] }, user.id))) })] }) })] })] }), showCreateUser && (_jsx(CreateUserModal, { onClose: () => setShowCreateUser(false), onCreateUser: (newUser) => {
                    setUsers([...users, { ...newUser, id: Math.random().toString(36).substr(2, 9) }]);
                    setShowCreateUser(false);
                } }))] }));
}
function getRoleBadgeColor(role) {
    switch (role) {
        case 'STAFF':
            return 'bg-blue-100 text-blue-800';
        case 'PROCUREMENT':
            return 'bg-green-100 text-green-800';
        case 'APPROVER_L1':
            return 'bg-purple-100 text-purple-800';
        case 'APPROVER_L2':
            return 'bg-indigo-100 text-indigo-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}
function CreateUserModal({ onClose, onCreateUser }) {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        role: 'STAFF',
        sites: [],
        areas: [],
        categories: [],
        tempPassword: ''
    });
    const availableSites = ['Site A', 'Site B', 'Site C'];
    const availableAreas = ['Kitchen', 'Office Supplies', 'Reception', 'Meeting Rooms', 'Storage'];
    const availableCategories = ['Office Supplies', 'Pantry', 'Cleaning', 'IT Equipment', 'Furniture'];
    const handleSubmit = (e) => {
        e.preventDefault();
        onCreateUser({
            username: formData.username,
            email: formData.email || undefined,
            firstName: formData.firstName,
            lastName: formData.lastName,
            role: formData.role,
            sites: formData.sites,
            areas: formData.areas,
            categories: formData.categories,
            isActive: true,
            createdAt: new Date().toISOString().split('T')[0]
        });
    };
    const handleCheckboxChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].includes(value)
                ? prev[field].filter(item => item !== value)
                : [...prev[field], value]
        }));
    };
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50", children: _jsx("div", { className: "bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto", children: _jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsx("h3", { className: "text-lg font-semibold text-slate-900", children: "Create New User" }), _jsx("button", { onClick: onClose, className: "text-slate-400 hover:text-slate-600", children: _jsx("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) }) })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "First Name *" }), _jsx("input", { type: "text", value: formData.firstName, onChange: (e) => setFormData({ ...formData, firstName: e.target.value }), required: true, className: "w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Last Name *" }), _jsx("input", { type: "text", value: formData.lastName, onChange: (e) => setFormData({ ...formData, lastName: e.target.value }), required: true, className: "w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Username *" }), _jsx("input", { type: "text", value: formData.username, onChange: (e) => setFormData({ ...formData, username: e.target.value }), placeholder: "john.smith", required: true, className: "w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Email (Optional)" }), _jsx("input", { type: "email", value: formData.email, onChange: (e) => setFormData({ ...formData, email: e.target.value }), placeholder: "john@company.com", className: "w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Role *" }), _jsxs("select", { value: formData.role, onChange: (e) => setFormData({ ...formData, role: e.target.value }), className: "w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "STAFF", children: "Staff (Submit requests, update stock)" }), _jsx("option", { value: "PROCUREMENT", children: "Procurement (Manage supplies)" }), _jsx("option", { value: "APPROVER_L1", children: "Approver Level 1" }), _jsx("option", { value: "APPROVER_L2", children: "Approver Level 2" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-2", children: "Temporary Password *" }), _jsx("input", { type: "password", value: formData.tempPassword, onChange: (e) => setFormData({ ...formData, tempPassword: e.target.value }), placeholder: "User will be required to change on first login", required: true, className: "w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" }), _jsx("p", { className: "text-xs text-slate-500 mt-1", children: "User will be forced to change password on first login" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-2", children: "Accessible Sites *" }), _jsx("div", { className: "space-y-2", children: availableSites.map(site => (_jsxs("label", { className: "flex items-center", children: [_jsx("input", { type: "checkbox", checked: formData.sites.includes(site), onChange: () => handleCheckboxChange('sites', site), className: "w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" }), _jsx("span", { className: "ml-2 text-sm text-slate-700", children: site })] }, site))) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-2", children: "Accessible Areas *" }), _jsx("div", { className: "grid grid-cols-2 gap-2", children: availableAreas.map(area => (_jsxs("label", { className: "flex items-center", children: [_jsx("input", { type: "checkbox", checked: formData.areas.includes(area), onChange: () => handleCheckboxChange('areas', area), className: "w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" }), _jsx("span", { className: "ml-2 text-sm text-slate-700", children: area })] }, area))) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-2", children: "Category Access *" }), _jsx("div", { className: "grid grid-cols-2 gap-2", children: availableCategories.map(category => (_jsxs("label", { className: "flex items-center", children: [_jsx("input", { type: "checkbox", checked: formData.categories.includes(category), onChange: () => handleCheckboxChange('categories', category), className: "w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" }), _jsx("span", { className: "ml-2 text-sm text-slate-700", children: category })] }, category))) })] }), _jsxs("div", { className: "flex justify-end space-x-3 pt-4", children: [_jsx("button", { type: "button", onClick: onClose, className: "px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500", children: "Cancel" }), _jsx("button", { type: "submit", disabled: !formData.firstName || !formData.lastName || !formData.username || !formData.tempPassword || formData.sites.length === 0 || formData.areas.length === 0 || formData.categories.length === 0, className: "px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed", children: "Create User" })] })] })] }) }) }));
}
