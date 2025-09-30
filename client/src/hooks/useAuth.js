import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useMemo, useState, useEffect } from 'react';
const AuthContext = createContext(undefined);
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [org, setOrg] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        // Check for existing auth on mount
        const storedUser = localStorage.getItem('user');
        const storedOrg = localStorage.getItem('current_org');
        // Clear old organization data that might have incorrect name
        if (storedOrg) {
            const orgData = JSON.parse(storedOrg);
            if (orgData.name === 'Acme Corporation') {
                localStorage.removeItem('current_org');
                setOrg(null);
            }
            else {
                setOrg(orgData);
            }
        }
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
    }, []);
    const signIn = async (email, password) => {
        try {
            const response = await fetch('/api/auth/signin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: email,
                    password: password
                })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error?.message || 'Login failed');
            }
            if (data.success && data.data) {
                const { user, tokens } = data.data;
                const authUser = {
                    id: user.id,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    role: user.role,
                    organizationId: user.organization_id
                };
                setUser(authUser);
                localStorage.setItem('auth_token', tokens.accessToken);
                localStorage.setItem('refresh_token', tokens.refreshToken);
                localStorage.setItem('user', JSON.stringify(authUser));
                // If user has organization, fetch it separately or handle org setup
                if (user.organization_id) {
                    // For now, set a basic org structure - you might want to fetch this from API
                    const org = {
                        id: user.organization_id,
                        name: 'Organization', // TODO: Fetch from API
                        slug: 'organization'
                    };
                    setOrg(org);
                    localStorage.setItem('current_org', JSON.stringify(org));
                }
            }
            else {
                throw new Error('Invalid response from server');
            }
        }
        catch (error) {
            throw new Error(error.message || 'Login failed');
        }
    };
    const signUp = async (userData) => {
        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: userData.email,
                    email: userData.email,
                    password: userData.password,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    organizationName: userData.organizationName
                })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error?.message || 'Registration failed');
            }
            if (data.success && data.data) {
                const { user, tokens, organization } = data.data;
                const authUser = {
                    id: user.id,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    role: user.role,
                    organizationId: user.organization_id
                };
                setUser(authUser);
                localStorage.setItem('auth_token', tokens.accessToken);
                localStorage.setItem('refresh_token', tokens.refreshToken);
                localStorage.setItem('user', JSON.stringify(authUser));
                // If organization was created, store it
                if (organization) {
                    const org = {
                        id: organization.id,
                        name: organization.name,
                        slug: organization.slug
                    };
                    setOrg(org);
                    localStorage.setItem('current_org', JSON.stringify(org));
                }
                else {
                    // Mark that organization setup is needed
                    localStorage.setItem('pending_org_setup', 'true');
                }
            }
            else {
                throw new Error('Invalid response from server');
            }
        }
        catch (error) {
            throw new Error(error.message || 'Registration failed');
        }
    };
    const getDashboardRoute = () => {
        if (!user)
            return '/login';
        // Check if org setup is pending (new admin user)
        if (localStorage.getItem('pending_org_setup')) {
            return '/organization-setup';
        }
        // Route based on user role
        switch (user.role) {
            case 'ADMIN':
                return '/admin-dashboard';
            case 'STAFF':
            case 'PROCUREMENT':
            case 'APPROVER_L1':
            case 'APPROVER_L2':
                return '/user-dashboard';
            default:
                return '/dashboard'; // fallback
        }
    };
    const value = useMemo(() => ({
        user,
        org,
        isLoading,
        setOrg: (o) => {
            setOrg(o);
            if (o)
                localStorage.setItem('current_org', JSON.stringify(o));
            else
                localStorage.removeItem('current_org');
        },
        signIn,
        signUp,
        signOut: () => {
            setUser(null);
            setOrg(null);
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            localStorage.removeItem('current_org');
            localStorage.removeItem('pending_org_setup');
        },
        getDashboardRoute
    }), [user, org, isLoading]);
    return (_jsx(AuthContext.Provider, { value: value, children: children }));
}
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx)
        throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
