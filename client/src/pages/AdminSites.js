import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// Updated Sites & Areas Management - Modern Design
import { useState, useEffect } from 'react';
import { Search, Upload, Download, Building2, MapPin, Edit, X, Plus, Power, PowerOff, UserCheck, ChevronDown, ChevronRight } from 'lucide-react';
export default function AdminSites() {
    const [showAddSite, setShowAddSite] = useState(false);
    const [showAddArea, setShowAddArea] = useState(false);
    const [selectedSite, setSelectedSite] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showEditSite, setShowEditSite] = useState(false);
    const [editingSite, setEditingSite] = useState(null);
    const [showEditArea, setShowEditArea] = useState(false);
    const [editingArea, setEditingArea] = useState(null);
    const [sites, setSites] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedSites, setExpandedSites] = useState(new Set());
    // API functions
    const fetchSites = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await fetch('/api/sites');
            const data = await response.json();
            if (data.success) {
                setSites(data.data);
            }
            else {
                console.error('Failed to fetch sites:', data.error);
                setSites([]); // Start with empty array if API fails
            }
        }
        catch (err) {
            console.error('Error fetching sites:', err);
            setError('Failed to load sites');
            setSites([]); // Start with empty array if API fails
        }
        finally {
            setIsLoading(false);
        }
    };
    const createSite = async (siteData) => {
        try {
            const response = await fetch('/api/sites', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(siteData),
            });
            const data = await response.json();
            if (data.success) {
                setSites(prev => [...prev, data.data]);
                return data.data;
            }
            else {
                throw new Error(data.error?.message || 'Failed to create site');
            }
        }
        catch (err) {
            console.error('Error creating site:', err);
            throw err;
        }
    };
    const createArea = async (areaData) => {
        try {
            const response = await fetch('/api/areas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(areaData),
            });
            const data = await response.json();
            if (data.success) {
                // Update the sites array to include the new area
                setSites(prev => prev.map(site => site.id === areaData.siteId
                    ? { ...site, areas: [...site.areas, {
                                id: data.data.id,
                                siteId: data.data.siteId,
                                name: data.data.name,
                                description: data.data.description,
                                isActive: data.data.isActive,
                                createdAt: data.data.createdAt
                            }] }
                    : site));
                return data.data;
            }
            else {
                throw new Error(data.error?.message || 'Failed to create area');
            }
        }
        catch (err) {
            console.error('Error creating area:', err);
            throw err;
        }
    };
    const updateSite = async (id, siteData) => {
        try {
            const response = await fetch(`/api/sites/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(siteData),
            });
            const data = await response.json();
            if (data.success) {
                setSites(prev => prev.map(site => site.id === id ? data.data : site));
                return data.data;
            }
            else {
                throw new Error(data.error?.message || 'Failed to update site');
            }
        }
        catch (err) {
            console.error('Error updating site:', err);
            throw err;
        }
    };
    const toggleSiteStatus = async (id) => {
        try {
            const response = await fetch(`/api/sites/${id}/toggle-status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
            if (data.success) {
                setSites(prev => prev.map(site => site.id === id ? { ...site, isActive: data.data.isActive } : site));
                return data.data;
            }
            else {
                throw new Error(data.error?.message || 'Failed to toggle site status');
            }
        }
        catch (err) {
            console.error('Error toggling site status:', err);
            throw err;
        }
    };
    const updateArea = async (areaId, areaData) => {
        try {
            const response = await fetch(`/api/areas/${areaId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(areaData),
            });
            const data = await response.json();
            if (data.success) {
                setSites(prev => prev.map(site => ({
                    ...site,
                    areas: site.areas.map(area => area.id === areaId ? data.data : area)
                })));
                return data.data;
            }
            else {
                throw new Error(data.error?.message || 'Failed to update area');
            }
        }
        catch (err) {
            console.error('Error updating area:', err);
            throw err;
        }
    };
    const toggleAreaStatus = async (areaId) => {
        try {
            const response = await fetch(`/api/areas/${areaId}/toggle-status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
            if (data.success) {
                setSites(prev => prev.map(site => ({
                    ...site,
                    areas: site.areas.map(area => area.id === areaId ? { ...area, isActive: data.data.isActive } : area)
                })));
                return data.data;
            }
            else {
                throw new Error(data.error?.message || 'Failed to toggle area status');
            }
        }
        catch (err) {
            console.error('Error toggling area status:', err);
            throw err;
        }
    };
    useEffect(() => {
        fetchSites();
    }, []);
    const toggleSiteExpansion = (siteId) => {
        setExpandedSites(prev => {
            const newSet = new Set(prev);
            if (newSet.has(siteId)) {
                newSet.delete(siteId);
            }
            else {
                newSet.add(siteId);
            }
            return newSet;
        });
    };
    const allAreas = sites.flatMap(site => site.areas);
    return (_jsxs("div", { className: "bg-slate-50", children: [_jsx("div", { className: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6", children: _jsxs("div", { className: "md:flex md:items-center md:justify-between", children: [_jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("h1", { className: "text-2xl font-bold text-slate-900", children: "Sites & Areas Management" }), _jsx("p", { className: "mt-1 text-sm text-slate-600", children: "Manage your organization's sites and their areas" })] }), _jsxs("div", { className: "mt-4 flex md:ml-4 md:mt-0 gap-3", children: [_jsxs("div", { className: "flex items-center gap-2 rounded-md border border-slate-300 px-3 py-1.5 text-sm bg-white", children: [_jsx(Search, { className: "w-4 h-4 text-slate-500" }), _jsx("input", { placeholder: "Search sites, areas", className: "border-0 focus:ring-0 w-40 text-sm", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value) })] }), _jsxs("button", { className: "inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50", children: [_jsx(Upload, { className: "w-4 h-4" }), "Import CSV"] }), _jsxs("button", { className: "inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50", children: [_jsx(Download, { className: "w-4 h-4" }), "Export"] }), _jsxs("button", { onClick: () => setShowAddSite(true), className: "inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 text-sm font-medium", children: [_jsx(Building2, { className: "w-4 h-4" }), "Add Site"] }), _jsxs("button", { onClick: () => setShowAddArea(true), className: "inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 text-sm font-medium", children: [_jsx(MapPin, { className: "w-4 h-4" }), "Add Area"] })] })] }) }), _jsxs("section", { className: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4", children: [_jsxs("div", { className: "rounded-xl border border-slate-200 bg-white p-4 shadow-sm", children: [_jsx("div", { className: "text-sm text-slate-600", children: "Total Sites" }), _jsx("div", { className: "mt-1 text-2xl font-semibold text-blue-600", children: sites.length })] }), _jsxs("div", { className: "rounded-xl border border-slate-200 bg-white p-4 shadow-sm", children: [_jsx("div", { className: "text-sm text-slate-600", children: "Total Areas" }), _jsx("div", { className: "mt-1 text-2xl font-semibold text-blue-600", children: allAreas.length })] }), _jsxs("div", { className: "rounded-xl border border-slate-200 bg-white p-4 shadow-sm", children: [_jsx("div", { className: "text-sm text-slate-600", children: "Low Stock Areas" }), _jsx("div", { className: "mt-1 text-2xl font-semibold text-amber-600", children: "4" })] }), _jsxs("div", { className: "rounded-xl border border-slate-200 bg-white p-4 shadow-sm", children: [_jsx("div", { className: "text-sm text-slate-600", children: "Inactive Locations" }), _jsx("div", { className: "mt-1 text-2xl font-semibold text-slate-900", children: sites.filter(s => !s.isActive).length })] })] }), _jsx("main", { className: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-10", children: _jsxs("div", { className: "rounded-xl border border-slate-200 bg-white overflow-hidden", children: [_jsxs("div", { className: "px-6 py-4 border-b border-slate-200 bg-slate-50", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-900", children: "Sites & Areas Management" }), _jsx("p", { className: "text-sm text-slate-600 mt-1", children: "Manage your organization's sites and their areas" })] }), _jsxs("div", { className: "p-6", children: [isLoading && (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "inline-flex items-center justify-center rounded-lg bg-blue-600 text-white w-12 h-12 font-bold text-xl mb-4", children: "OS" }), _jsx("p", { className: "text-slate-600", children: "Loading sites..." })] }) })), error && (_jsx("div", { className: "bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md", children: error })), !isLoading && !error && sites.length === 0 && (_jsxs("div", { className: "text-center py-12", children: [_jsx("div", { className: "mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4", children: _jsx(Building2, { className: "w-8 h-8 text-slate-400" }) }), _jsx("h3", { className: "text-lg font-semibold text-slate-900 mb-2", children: "No sites yet" }), _jsx("p", { className: "text-slate-600 mb-6", children: "Create your first site to start organizing your office locations." }), _jsxs("button", { onClick: () => setShowAddSite(true), className: "inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700", children: [_jsx(Building2, { className: "w-4 h-4" }), "Create First Site"] })] })), !isLoading && !error && sites.length > 0 && (_jsx("div", { className: "space-y-4", children: sites.map((site) => (_jsxs("div", { className: "border border-slate-200 rounded-lg overflow-hidden", children: [_jsx("div", { className: "bg-slate-50 px-6 py-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("button", { onClick: () => toggleSiteExpansion(site.id), className: "p-1 hover:bg-slate-200 rounded", title: expandedSites.has(site.id) ? 'Collapse' : 'Expand', children: expandedSites.has(site.id) ? (_jsx(ChevronDown, { className: "w-4 h-4 text-slate-600" })) : (_jsx(ChevronRight, { className: "w-4 h-4 text-slate-600" })) }), _jsx(Building2, { className: "w-5 h-5 text-indigo-600" }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("h3", { className: "font-semibold text-slate-900", children: site.name }), site.name === 'Headquarters' && (_jsx("span", { className: "text-xs rounded bg-slate-200 px-1.5 py-0.5 text-slate-700", children: "HQ" })), _jsx("span", { className: `inline-flex px-2 py-1 text-xs font-semibold rounded-full ${site.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`, children: site.isActive ? 'Active' : 'Disabled' })] }), _jsxs("div", { className: "text-sm text-slate-600 mt-1", children: [site.description && _jsx("span", { children: site.description }), site.description && site.address && _jsx("span", { children: " \u2022 " }), site.address && _jsx("span", { children: site.address })] }), _jsxs("div", { className: "text-xs text-slate-500 mt-1", children: [site.areas.length, " area", site.areas.length !== 1 ? 's' : ''] })] })] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("button", { onClick: () => {
                                                                        setEditingSite(site);
                                                                        setShowEditSite(true);
                                                                    }, className: "p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 rounded-md transition-colors", title: "Edit Site", children: _jsx(Edit, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => {
                                                                        // TODO: Implement user management for sites
                                                                        alert(`User management for "${site.name}" site will be implemented soon. This will allow you to assign users to specific sites.`);
                                                                    }, className: "p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors", title: "Manage Users", children: _jsx(UserCheck, { className: "w-4 h-4" }) }), _jsx("button", { onClick: async () => {
                                                                        try {
                                                                            await toggleSiteStatus(site.id);
                                                                        }
                                                                        catch (err) {
                                                                            alert('Failed to toggle site status: ' + (err instanceof Error ? err.message : 'Unknown error'));
                                                                        }
                                                                    }, className: `p-2 rounded-md transition-colors ${site.isActive
                                                                        ? 'text-red-600 hover:text-red-800 hover:bg-red-100'
                                                                        : 'text-green-600 hover:text-green-800 hover:bg-green-100'}`, title: site.isActive ? 'Disable Site' : 'Enable Site', children: site.isActive ? _jsx(PowerOff, { className: "w-4 h-4" }) : _jsx(Power, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => {
                                                                        setSelectedSite(site.id);
                                                                        setShowAddArea(true);
                                                                    }, className: "p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 rounded-md transition-colors", title: "Add Area", children: _jsx(Plus, { className: "w-4 h-4" }) })] })] }) }), expandedSites.has(site.id) && (_jsx("div", { className: "bg-white", children: site.areas.length === 0 ? (_jsxs("div", { className: "px-6 py-8 text-center", children: [_jsx(MapPin, { className: "w-8 h-8 text-slate-400 mx-auto mb-3" }), _jsx("p", { className: "text-slate-600 text-sm", children: "No areas created yet" }), _jsxs("button", { onClick: () => {
                                                                setSelectedSite(site.id);
                                                                setShowAddArea(true);
                                                            }, className: "mt-3 inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800", children: [_jsx(Plus, { className: "w-4 h-4" }), "Add first area"] })] })) : (_jsx("div", { className: "divide-y divide-slate-100", children: site.areas.map((area) => (_jsx("div", { className: "px-6 py-4 hover:bg-slate-50", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-2 h-8 bg-slate-300 rounded-full" }), _jsx(MapPin, { className: "w-4 h-4 text-slate-500" }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "font-medium text-slate-900", children: area.name }), _jsx("span", { className: `inline-flex px-2 py-1 text-xs font-semibold rounded-full ${area.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`, children: area.isActive ? 'Active' : 'Disabled' })] }), area.description && (_jsx("div", { className: "text-sm text-slate-600 mt-1", children: area.description })), _jsxs("div", { className: "text-xs text-slate-500 mt-1", children: ["Created ", new Date(area.createdAt).toLocaleDateString()] })] })] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("button", { onClick: () => {
                                                                                setEditingArea(area);
                                                                                setShowEditArea(true);
                                                                            }, className: "p-1.5 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded transition-colors", title: "Edit Area", children: _jsx(Edit, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => {
                                                                                // TODO: Implement user management for areas
                                                                                alert(`User management for "${area.name}" area will be implemented soon. This will allow you to assign users to specific areas.`);
                                                                            }, className: "p-1.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors", title: "Manage Users", children: _jsx(UserCheck, { className: "w-4 h-4" }) }), _jsx("button", { onClick: async () => {
                                                                                try {
                                                                                    await toggleAreaStatus(area.id);
                                                                                }
                                                                                catch (err) {
                                                                                    alert('Failed to toggle area status: ' + (err instanceof Error ? err.message : 'Unknown error'));
                                                                                }
                                                                            }, className: `p-1.5 rounded transition-colors ${area.isActive
                                                                                ? 'text-red-600 hover:text-red-800 hover:bg-red-100'
                                                                                : 'text-green-600 hover:text-green-800 hover:bg-green-100'}`, title: area.isActive ? 'Disable Area' : 'Enable Area', children: area.isActive ? _jsx(PowerOff, { className: "w-4 h-4" }) : _jsx(Power, { className: "w-4 h-4" }) })] })] }) }, area.id))) })) }))] }, site.id))) }))] })] }) }), showAddSite && (_jsx(AddSiteModal, { onClose: () => setShowAddSite(false), onSave: async (siteData) => {
                    try {
                        await createSite(siteData);
                        setShowAddSite(false);
                    }
                    catch (err) {
                        alert('Failed to create site: ' + (err instanceof Error ? err.message : 'Unknown error'));
                    }
                } })), showAddArea && (_jsx(AddAreaModal, { sites: sites, selectedSiteId: selectedSite, onClose: () => {
                    setShowAddArea(false);
                    setSelectedSite(null);
                }, onSave: async (areaData) => {
                    try {
                        await createArea(areaData);
                        setShowAddArea(false);
                        setSelectedSite(null);
                    }
                    catch (err) {
                        alert('Failed to create area: ' + (err instanceof Error ? err.message : 'Unknown error'));
                    }
                } })), showEditSite && editingSite && (_jsx(EditSiteModal, { site: editingSite, onClose: () => {
                    setShowEditSite(false);
                    setEditingSite(null);
                }, onSave: async (siteData) => {
                    try {
                        await updateSite(editingSite.id, siteData);
                        setShowEditSite(false);
                        setEditingSite(null);
                    }
                    catch (err) {
                        alert('Failed to update site: ' + (err instanceof Error ? err.message : 'Unknown error'));
                    }
                } })), showEditArea && editingArea && (_jsx(EditAreaModal, { area: editingArea, onClose: () => {
                    setShowEditArea(false);
                    setEditingArea(null);
                }, onSave: async (areaData) => {
                    try {
                        await updateArea(editingArea.id, areaData);
                        setShowEditArea(false);
                        setEditingArea(null);
                    }
                    catch (err) {
                        alert('Failed to update area: ' + (err instanceof Error ? err.message : 'Unknown error'));
                    }
                } }))] }));
}
function AddSiteModal({ onClose, onSave }) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        address: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting)
            return;
        setIsSubmitting(true);
        try {
            await onSave(formData);
        }
        catch (err) {
            // Error handling is done in the parent component
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50", children: _jsx("div", { className: "bg-white rounded-lg max-w-md w-full", children: _jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsx("h3", { className: "text-lg font-semibold text-slate-900", children: "Add New Site" }), _jsx("button", { onClick: onClose, className: "text-slate-400 hover:text-slate-600", children: _jsx(X, { className: "w-6 h-6" }) })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Site Name *" }), _jsx("input", { type: "text", value: formData.name, onChange: (e) => setFormData({ ...formData, name: e.target.value }), placeholder: "Enter site name", required: true, className: "w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Description" }), _jsx("textarea", { value: formData.description, onChange: (e) => setFormData({ ...formData, description: e.target.value }), placeholder: "Enter site description", rows: 3, className: "w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Address" }), _jsx("textarea", { value: formData.address, onChange: (e) => setFormData({ ...formData, address: e.target.value }), placeholder: "Enter site address", rows: 2, className: "w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { className: "flex justify-end space-x-3 pt-4", children: [_jsx("button", { type: "button", onClick: onClose, className: "px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50", children: "Cancel" }), _jsx("button", { type: "submit", disabled: !formData.name || isSubmitting, className: "px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50", children: isSubmitting ? 'Creating...' : 'Create Site' })] })] })] }) }) }));
}
function AddAreaModal({ sites, selectedSiteId, onClose, onSave }) {
    const [formData, setFormData] = useState({
        siteId: selectedSiteId || '',
        name: '',
        description: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting)
            return;
        setIsSubmitting(true);
        try {
            await onSave(formData);
        }
        catch (err) {
            // Error handling is done in the parent component
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50", children: _jsx("div", { className: "bg-white rounded-lg max-w-md w-full", children: _jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsx("h3", { className: "text-lg font-semibold text-slate-900", children: "Add New Area" }), _jsx("button", { onClick: onClose, className: "text-slate-400 hover:text-slate-600", children: _jsx(X, { className: "w-6 h-6" }) })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Site *" }), _jsxs("select", { value: formData.siteId, onChange: (e) => setFormData({ ...formData, siteId: e.target.value }), required: true, className: "w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "", children: "Select a site" }), sites.map(site => (_jsx("option", { value: site.id, children: site.name }, site.id)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Area Name *" }), _jsx("input", { type: "text", value: formData.name, onChange: (e) => setFormData({ ...formData, name: e.target.value }), placeholder: "e.g., Kitchen, Office Supplies, Reception", required: true, className: "w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Description" }), _jsx("textarea", { value: formData.description, onChange: (e) => setFormData({ ...formData, description: e.target.value }), placeholder: "Enter area description", rows: 3, className: "w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { className: "flex justify-end space-x-3 pt-4", children: [_jsx("button", { type: "button", onClick: onClose, className: "px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50", children: "Cancel" }), _jsx("button", { type: "submit", disabled: !formData.siteId || !formData.name || isSubmitting, className: "px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50", children: isSubmitting ? 'Creating...' : 'Create Area' })] })] })] }) }) }));
}
function EditSiteModal({ site, onClose, onSave }) {
    const [formData, setFormData] = useState({
        name: site.name,
        description: site.description || '',
        address: site.address || ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting)
            return;
        setIsSubmitting(true);
        try {
            await onSave(formData);
        }
        catch (err) {
            // Error handling is done in the parent component
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50", children: _jsx("div", { className: "bg-white rounded-lg max-w-md w-full", children: _jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsx("h3", { className: "text-lg font-semibold text-slate-900", children: "Edit Site" }), _jsx("button", { onClick: onClose, className: "text-slate-400 hover:text-slate-600", children: _jsx(X, { className: "w-6 h-6" }) })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Site Name *" }), _jsx("input", { type: "text", value: formData.name, onChange: (e) => setFormData({ ...formData, name: e.target.value }), placeholder: "Enter site name", required: true, className: "w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Description" }), _jsx("textarea", { value: formData.description, onChange: (e) => setFormData({ ...formData, description: e.target.value }), placeholder: "Enter site description", rows: 3, className: "w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Address" }), _jsx("textarea", { value: formData.address, onChange: (e) => setFormData({ ...formData, address: e.target.value }), placeholder: "Enter site address", rows: 2, className: "w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { className: "flex justify-end space-x-3 pt-4", children: [_jsx("button", { type: "button", onClick: onClose, className: "px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50", children: "Cancel" }), _jsx("button", { type: "submit", disabled: !formData.name || isSubmitting, className: "px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50", children: isSubmitting ? 'Updating...' : 'Update Site' })] })] })] }) }) }));
}
function EditAreaModal({ area, onClose, onSave }) {
    const [formData, setFormData] = useState({
        name: area.name,
        description: area.description || ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim())
            return;
        try {
            setIsSubmitting(true);
            await onSave(formData);
        }
        catch (err) {
            console.error('Failed to update area:', err);
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50", children: _jsxs("div", { className: "bg-white rounded-lg max-w-md w-full", children: [_jsxs("div", { className: "flex items-center justify-between p-6 border-b border-slate-200", children: [_jsx("h3", { className: "text-lg font-semibold text-slate-900", children: "Edit Area" }), _jsx("button", { onClick: onClose, className: "text-slate-400 hover:text-slate-600", disabled: isSubmitting, children: _jsx(X, { className: "w-5 h-5" }) })] }), _jsxs("form", { onSubmit: handleSubmit, className: "p-6 space-y-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "area-name", className: "block text-sm font-medium text-slate-700 mb-1", children: "Area Name *" }), _jsx("input", { id: "area-name", type: "text", value: formData.name, onChange: (e) => setFormData({ ...formData, name: e.target.value }), className: "w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500", placeholder: "e.g., Conference Room A", required: true, disabled: isSubmitting })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "area-description", className: "block text-sm font-medium text-slate-700 mb-1", children: "Description" }), _jsx("textarea", { id: "area-description", value: formData.description, onChange: (e) => setFormData({ ...formData, description: e.target.value }), className: "w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500", placeholder: "Optional description", rows: 3, disabled: isSubmitting })] }), _jsxs("div", { className: "flex justify-end space-x-3 pt-4", children: [_jsx("button", { type: "button", onClick: onClose, className: "px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500", disabled: isSubmitting, children: "Cancel" }), _jsx("button", { type: "submit", disabled: !formData.name.trim() || isSubmitting, className: "px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed", children: isSubmitting ? 'Updating...' : 'Update Area' })] })] })] }) }));
}
