import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { apiClient } from '../lib/api';
import { AlertTriangleIcon } from '../components/icons';
export default function LoginPage({ onLogin }) {
    const [isSignUp, setIsSignUp] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        organizationName: ''
    });
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            let response;
            if (isSignUp) {
                response = await apiClient.signup({
                    email: formData.email,
                    password: formData.password,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    organizationName: formData.organizationName
                });
            }
            else {
                response = await apiClient.signin({
                    username: formData.email,
                    password: formData.password
                });
            }
            if (response.success) {
                onLogin();
            }
            else {
                setError(response.error?.message || 'Authentication failed');
            }
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Network error occurred');
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };
    return (_jsxs("div", { className: "min-h-screen flex", children: [_jsxs("div", { className: "hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 relative overflow-hidden", children: [_jsx("div", { className: "absolute inset-0 bg-black/10" }), _jsx("div", { className: "relative z-10 flex flex-col justify-center px-12 text-white", children: _jsxs("div", { className: "max-w-md", children: [_jsxs("div", { className: "flex items-center space-x-3 mb-8", children: [_jsx("div", { className: "w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm", children: _jsx("span", { className: "text-white font-bold text-lg", children: "OS" }) }), _jsx("h1", { className: "text-3xl font-bold", children: "OfficeStore" })] }), _jsx("h2", { className: "text-4xl font-bold mb-6 leading-tight", children: "Modern Supply Chain Management" }), _jsx("p", { className: "text-blue-100 text-lg leading-relaxed mb-8", children: "Streamline your office supplies, manage requests efficiently, and maintain perfect inventory control with our enterprise-grade platform." }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "w-2 h-2 bg-white rounded-full" }), _jsx("span", { className: "text-blue-100", children: "Real-time inventory tracking" })] }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "w-2 h-2 bg-white rounded-full" }), _jsx("span", { className: "text-blue-100", children: "Automated approval workflows" })] }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "w-2 h-2 bg-white rounded-full" }), _jsx("span", { className: "text-blue-100", children: "Advanced analytics & reporting" })] })] })] }) }), _jsx("div", { className: "absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-40 translate-x-40" }), _jsx("div", { className: "absolute bottom-0 left-0 w-60 h-60 bg-white/5 rounded-full translate-y-40 -translate-x-40" })] }), _jsx("div", { className: "flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-neutral-50", children: _jsxs("div", { className: "max-w-md w-full", children: [_jsxs("div", { className: "lg:hidden text-center mb-8", children: [_jsxs("div", { className: "flex items-center justify-center space-x-3 mb-4", children: [_jsx("div", { className: "w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center", children: _jsx("span", { className: "text-white font-bold text-sm", children: "OS" }) }), _jsx("h1", { className: "text-2xl font-bold text-neutral-900", children: "OfficeStore" })] }), _jsx("p", { className: "text-neutral-600", children: "Pantry & Office Supplies Management" })] }), _jsx("div", { className: "card", children: _jsxs("div", { className: "card-body", children: [_jsxs("div", { className: "text-center mb-6", children: [_jsx("h2", { className: "text-2xl font-bold text-neutral-900 mb-2", children: isSignUp ? 'Create Account' : 'Welcome Back' }), _jsx("p", { className: "text-neutral-600", children: isSignUp
                                                    ? 'Set up your organization and start managing supplies'
                                                    : 'Sign in to access your dashboard' })] }), _jsxs("form", { className: "space-y-5", onSubmit: handleSubmit, children: [isSignUp && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "firstName", className: "block text-sm font-medium text-neutral-700 mb-2", children: "First Name" }), _jsx("input", { id: "firstName", name: "firstName", type: "text", required: true, value: formData.firstName, onChange: handleChange, className: "input", placeholder: "John" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "lastName", className: "block text-sm font-medium text-neutral-700 mb-2", children: "Last Name" }), _jsx("input", { id: "lastName", name: "lastName", type: "text", required: true, value: formData.lastName, onChange: handleChange, className: "input", placeholder: "Doe" })] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "organizationName", className: "block text-sm font-medium text-neutral-700 mb-2", children: "Organization Name" }), _jsx("input", { id: "organizationName", name: "organizationName", type: "text", required: true, value: formData.organizationName, onChange: handleChange, className: "input", placeholder: "Acme Corporation" }), _jsx("p", { className: "mt-2 text-xs text-neutral-500", children: "You will be the admin of this organization" })] })] })), _jsxs("div", { children: [_jsx("label", { htmlFor: "email", className: "block text-sm font-medium text-neutral-700 mb-2", children: "Email Address" }), _jsx("input", { id: "email", name: "email", type: "email", autoComplete: "email", required: true, value: formData.email, onChange: handleChange, className: "input", placeholder: "you@company.com" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "password", className: "block text-sm font-medium text-neutral-700 mb-2", children: "Password" }), _jsx("input", { id: "password", name: "password", type: "password", autoComplete: isSignUp ? "new-password" : "current-password", required: true, value: formData.password, onChange: handleChange, className: "input", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" }), isSignUp && (_jsx("p", { className: "mt-2 text-xs text-neutral-500", children: "Must contain uppercase, lowercase, number, and special character" }))] }), error && (_jsxs("div", { className: "flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg", children: [_jsx(AlertTriangleIcon, { className: "w-5 h-5 text-red-500 flex-shrink-0" }), _jsx("span", { className: "text-red-700 text-sm", children: error })] })), _jsx("button", { type: "submit", disabled: isLoading, className: "btn-primary w-full py-3", children: isLoading ? (_jsxs("div", { className: "flex items-center justify-center space-x-2", children: [_jsx("div", { className: "spinner w-4 h-4" }), _jsx("span", { children: "Processing..." })] })) : (isSignUp ? 'Create Account' : 'Sign In') }), _jsx("div", { className: "text-center pt-4 border-t border-neutral-200", children: _jsx("button", { type: "button", onClick: () => {
                                                        setIsSignUp(!isSignUp);
                                                        setError(null);
                                                        setFormData({
                                                            email: '',
                                                            password: '',
                                                            firstName: '',
                                                            lastName: '',
                                                            organizationName: ''
                                                        });
                                                    }, className: "text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors", children: isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up" }) })] })] }) }), _jsx("div", { className: "mt-8 text-center text-xs text-neutral-400", children: _jsx("p", { children: "Dev: API :3001 \u2022 Client :3002" }) })] }) })] }));
}
