import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
export default function OrganizationSetup() {
    const [formData, setFormData] = useState({
        organizationName: '',
        description: '',
        industry: '',
        size: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { user, setOrg } = useAuth();
    const navigate = useNavigate();
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            // Create organization and set user as admin
            const newOrg = {
                id: Math.random().toString(36).substr(2, 9),
                name: formData.organizationName,
                slug: formData.organizationName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
            };
            setOrg(newOrg);
            localStorage.removeItem('pending_org_setup');
            // Update user with organization ID
            if (user) {
                const updatedUser = { ...user, organizationId: newOrg.id };
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }
            navigate('/admin-dashboard');
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Organization setup failed');
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center p-6 bg-slate-50", children: _jsxs("div", { className: "w-full max-w-lg bg-white rounded-xl border border-slate-200 p-8 shadow-lg", children: [_jsx("div", { className: "flex justify-center mb-8", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "inline-flex items-center justify-center rounded-lg bg-blue-600 text-white w-10 h-10 font-bold text-lg", children: "OS" }), _jsx("span", { className: "font-bold text-xl text-slate-900", children: "OfficeStore" })] }) }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "text-center", children: [_jsx("h2", { className: "text-2xl font-bold text-slate-900", children: "Setup Your Organization" }), _jsxs("p", { className: "text-sm text-slate-600 mt-2", children: ["Welcome ", user?.firstName, "! Let's set up your organization and make you the administrator."] })] }), error && (_jsx("div", { className: "bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm", children: error })), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "organizationName", className: "block text-sm font-medium text-slate-700 mb-1", children: "Organization Name *" }), _jsx("input", { id: "organizationName", name: "organizationName", type: "text", value: formData.organizationName, onChange: handleInputChange, placeholder: "Acme Corporation", required: true, className: "w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "description", className: "block text-sm font-medium text-slate-700 mb-1", children: "Description" }), _jsx("textarea", { id: "description", name: "description", value: formData.description, onChange: handleInputChange, placeholder: "Brief description of your organization", rows: 3, className: "w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "industry", className: "block text-sm font-medium text-slate-700 mb-1", children: "Industry" }), _jsxs("select", { id: "industry", name: "industry", value: formData.industry, onChange: handleInputChange, className: "w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500", children: [_jsx("option", { value: "", children: "Select industry" }), _jsx("option", { value: "technology", children: "Technology" }), _jsx("option", { value: "healthcare", children: "Healthcare" }), _jsx("option", { value: "finance", children: "Finance" }), _jsx("option", { value: "manufacturing", children: "Manufacturing" }), _jsx("option", { value: "retail", children: "Retail" }), _jsx("option", { value: "education", children: "Education" }), _jsx("option", { value: "government", children: "Government" }), _jsx("option", { value: "nonprofit", children: "Non-profit" }), _jsx("option", { value: "other", children: "Other" })] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "size", className: "block text-sm font-medium text-slate-700 mb-1", children: "Organization Size" }), _jsxs("select", { id: "size", name: "size", value: formData.size, onChange: handleInputChange, className: "w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500", children: [_jsx("option", { value: "", children: "Select size" }), _jsx("option", { value: "1-10", children: "1-10 employees" }), _jsx("option", { value: "11-50", children: "11-50 employees" }), _jsx("option", { value: "51-200", children: "51-200 employees" }), _jsx("option", { value: "201-500", children: "201-500 employees" }), _jsx("option", { value: "501-1000", children: "501-1000 employees" }), _jsx("option", { value: "1000+", children: "1000+ employees" })] })] }), _jsxs("div", { className: "bg-blue-50 border border-blue-200 p-4 rounded-md", children: [_jsx("h4", { className: "text-sm font-medium text-blue-900 mb-1", children: "Administrator Role" }), _jsx("p", { className: "text-sm text-blue-700", children: "You will become the administrator of this organization with full access to:" }), _jsxs("ul", { className: "text-sm text-blue-700 mt-2 list-disc list-inside space-y-1", children: [_jsx("li", { children: "Manage sites and areas" }), _jsx("li", { children: "Create and manage user accounts" }), _jsx("li", { children: "Oversee all requests and approvals" }), _jsx("li", { children: "Access analytics and reports" }), _jsx("li", { children: "Configure organization settings" })] })] }), _jsx("button", { type: "submit", disabled: isLoading || !formData.organizationName, className: "w-full bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed", children: isLoading ? 'Setting up organization...' : 'Complete Setup' })] })] })] }) }));
}
