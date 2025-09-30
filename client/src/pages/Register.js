import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
export default function Register() {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        organizationName: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { signUp } = useAuth();
    const navigate = useNavigate();
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setIsLoading(false);
            return;
        }
        try {
            await signUp({
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                password: formData.password,
                organizationName: formData.organizationName
            });
            navigate('/admin-dashboard');
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Registration failed');
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleGoogleSignUp = () => {
        const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
        window.location.href = `${base}/api/auth/google`;
    };
    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center p-6 bg-slate-50", children: _jsxs("div", { className: "w-full max-w-md bg-white rounded-xl border border-slate-200 p-8 shadow-lg", children: [_jsx("div", { className: "flex justify-center mb-8", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "inline-flex items-center justify-center rounded-lg bg-blue-600 text-white w-10 h-10 font-bold text-lg", children: "OS" }), _jsx("span", { className: "font-bold text-xl text-slate-900", children: "OfficeStore" })] }) }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "text-center", children: [_jsx("h2", { className: "text-2xl font-bold text-slate-900", children: "Create Organization" }), _jsx("p", { className: "text-sm text-slate-600 mt-2", children: "Set up your organization and become the administrator" })] }), error && (_jsx("div", { className: "bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm", children: error })), _jsxs("button", { type: "button", onClick: handleGoogleSignUp, className: "w-full flex items-center justify-center gap-3 border border-slate-300 rounded-md py-2 px-4 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors", children: [_jsxs("svg", { className: "w-5 h-5", viewBox: "0 0 24 24", children: [_jsx("path", { fill: "#4285F4", d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" }), _jsx("path", { fill: "#34A853", d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" }), _jsx("path", { fill: "#FBBC05", d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" }), _jsx("path", { fill: "#EA4335", d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" })] }), "Continue with Google"] }), _jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute inset-0 flex items-center", children: _jsx("div", { className: "w-full border-t border-slate-300" }) }), _jsx("div", { className: "relative flex justify-center text-sm", children: _jsx("span", { className: "px-2 bg-white text-slate-500", children: "Or continue with email" }) })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "firstName", className: "block text-sm font-medium text-slate-700 mb-1", children: "First name" }), _jsx("input", { id: "firstName", name: "firstName", type: "text", value: formData.firstName, onChange: handleInputChange, placeholder: "John", required: true, className: "w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "lastName", className: "block text-sm font-medium text-slate-700 mb-1", children: "Last name" }), _jsx("input", { id: "lastName", name: "lastName", type: "text", value: formData.lastName, onChange: handleInputChange, placeholder: "Doe", required: true, className: "w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" })] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "organizationName", className: "block text-sm font-medium text-slate-700 mb-1", children: "Organization name" }), _jsx("input", { id: "organizationName", name: "organizationName", type: "text", value: formData.organizationName, onChange: handleInputChange, placeholder: "Your Company Name", required: true, className: "w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "email", className: "block text-sm font-medium text-slate-700 mb-1", children: "Email address" }), _jsx("input", { id: "email", name: "email", type: "email", value: formData.email, onChange: handleInputChange, placeholder: "john@company.com", required: true, className: "w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "password", className: "block text-sm font-medium text-slate-700 mb-1", children: "Password" }), _jsx("input", { id: "password", name: "password", type: "password", value: formData.password, onChange: handleInputChange, placeholder: "Create a strong password", required: true, className: "w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "confirmPassword", className: "block text-sm font-medium text-slate-700 mb-1", children: "Confirm password" }), _jsx("input", { id: "confirmPassword", name: "confirmPassword", type: "password", value: formData.confirmPassword, onChange: handleInputChange, placeholder: "Confirm your password", required: true, className: "w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" })] }), _jsx("button", { type: "submit", disabled: isLoading, className: "w-full bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed", children: isLoading ? 'Creating account...' : 'Create Organization' })] }), _jsx("div", { className: "text-center", children: _jsxs("p", { className: "text-sm text-slate-600", children: ["Already have an account?", ' ', _jsx(Link, { to: "/login", className: "text-blue-600 hover:text-blue-700 font-medium", children: "Sign in" })] }) })] })] }) }));
}
