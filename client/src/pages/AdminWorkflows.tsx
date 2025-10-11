// AdminWorkflows.tsx
// Workflow management page - list, create, edit, delete workflows
// Date: 2025-10-09

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Copy,
  Play,
  Power,
  Filter,
  RefreshCw
} from 'lucide-react';

interface Workflow {
  id: string;
  name: string;
  description?: string;
  trigger_event: string;
  applies_to: any;
  is_active: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

export default function AdminWorkflows() {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTrigger, setFilterTrigger] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const getAuthToken = () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Authentication required. Please sign in again.');
    }
    return token;
  };

  const fetchWorkflows = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAuthToken();
      const response = await fetch('/api/workflows', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error?.message || data?.message || 'Failed to fetch workflows');
      }

      setWorkflows(data?.data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching workflows:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`/api/workflows/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error?.message || data?.message || 'Failed to update workflow');
      }

      // Refresh list
      fetchWorkflows();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const deleteWorkflow = async (id: string, name: string) => {
    if (!confirm(`Delete workflow "${name}"? This cannot be undone.`)) {
      return;
    }

    try {
      const token = getAuthToken();
      const response = await fetch(`/api/workflows/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error?.message || data?.message || 'Failed to delete workflow');
      }

      // Refresh list
      fetchWorkflows();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const duplicateWorkflow = async (id: string) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`/api/workflows/${id}/duplicate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error?.message || data?.message || 'Failed to duplicate workflow');
      }

      // Refresh list
      fetchWorkflows();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workflow.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTrigger = filterTrigger === 'all' || workflow.trigger_event === filterTrigger;
    return matchesSearch && matchesTrigger;
  });

  const triggerEvents = ['all', 'request_submitted', 'request_approved', 'request_rejected', 'request_fulfilled'];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Workflow Management</h1>
          <p className="mt-2 text-slate-600">
            Design and manage automated approval workflows for your organization
          </p>
        </div>

        {/* Actions Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search workflows..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filter */}
            <div className="flex gap-2 items-center">
              <Filter className="w-5 h-5 text-slate-400" />
              <select
                value={filterTrigger}
                onChange={(e) => setFilterTrigger(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {triggerEvents.map(trigger => (
                  <option key={trigger} value={trigger}>
                    {trigger === 'all' ? 'All Triggers' : trigger.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            {/* Refresh */}
            <button
              onClick={fetchWorkflows}
              className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>

            {/* Create Button */}
            <button
              onClick={() => navigate('/admin/workflows/new')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Workflow
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-slate-600">Loading workflows...</p>
          </div>
        )}

        {/* Workflows Table */}
        {!loading && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            {filteredWorkflows.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-slate-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-1">No workflows found</h3>
                <p className="text-slate-600 mb-4">
                  {searchTerm || filterTrigger !== 'all'
                    ? 'Try adjusting your search or filter criteria'
                    : 'Get started by creating your first workflow'}
                </p>
                {!searchTerm && filterTrigger === 'all' && (
                  <button
                    onClick={() => navigate('/admin/workflows/new')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    <Plus className="w-4 h-4" />
                    Create Your First Workflow
                  </button>
                )}
              </div>
            ) : (
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Workflow Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Trigger
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Applies To
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Version
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {filteredWorkflows.map((workflow) => (
                    <tr key={workflow.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">{workflow.name}</div>
                        {workflow.description && (
                          <div className="text-sm text-slate-500">{workflow.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                          {workflow.trigger_event.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {workflow.applies_to ? 'Specific' : 'All'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleActive(workflow.id, workflow.is_active)}
                          className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition ${
                            workflow.is_active
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <Power className="w-3 h-3" />
                          {workflow.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        v{workflow.version}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/admin/workflows/${workflow.id}/edit`)}
                            className="text-blue-600 hover:text-blue-900 p-1.5 hover:bg-blue-50 rounded transition"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => duplicateWorkflow(workflow.id)}
                            className="text-slate-600 hover:text-slate-900 p-1.5 hover:bg-slate-100 rounded transition"
                            title="Duplicate"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/admin/workflows/${workflow.id}/test`)}
                            className="text-green-600 hover:text-green-900 p-1.5 hover:bg-green-50 rounded transition"
                            title="Test"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteWorkflow(workflow.id, workflow.name)}
                            className="text-red-600 hover:text-red-900 p-1.5 hover:bg-red-50 rounded transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Summary */}
        {!loading && filteredWorkflows.length > 0 && (
          <div className="mt-4 text-sm text-slate-600">
            Showing {filteredWorkflows.length} workflow{filteredWorkflows.length !== 1 ? 's' : ''}
            {searchTerm && ` matching "${searchTerm}"`}
          </div>
        )}
      </div>
    </div>
  );
}
