// WorkflowBuilder.tsx
// Visual workflow builder for creating and editing workflows
// Date: 2025-10-09

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Save,
  X,
  Play,
  Plus,
  Trash2,
  GitBranch,
  Zap,
  Users,
  Bell,
  Clock,
  Link as LinkIcon,
  Settings,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface WorkflowNode {
  id: string;
  type: 'start' | 'end' | 'decision' | 'action' | 'assignment' | 'notification' | 'delay' | 'integration';
  label?: string;
  position?: { x: number; y: number };
  config: any;
  next?: string;
}

interface WorkflowDefinition {
  name: string;
  description?: string;
  triggerEvent: string;
  appliesTo: {
    categories?: string[] | null;
    sites?: string[] | null;
  } | null;
  nodes: WorkflowNode[];
  version?: number;
}

// ============================================================================
// Node Type Metadata
// ============================================================================

const NODE_TYPES = {
  start: {
    label: 'Start',
    icon: Play,
    color: 'emerald',
    description: 'Workflow entry point'
  },
  end: {
    label: 'End',
    icon: X,
    color: 'red',
    description: 'Workflow termination'
  },
  decision: {
    label: 'Decision',
    icon: GitBranch,
    color: 'blue',
    description: 'Branch based on a condition'
  },
  action: {
    label: 'Action',
    icon: Zap,
    color: 'purple',
    description: 'Perform an automated action'
  },
  assignment: {
    label: 'Assignment',
    icon: Users,
    color: 'green',
    description: 'Assign task to user or role'
  },
  notification: {
    label: 'Notification',
    icon: Bell,
    color: 'yellow',
    description: 'Send a notification'
  },
  delay: {
    label: 'Delay',
    icon: Clock,
    color: 'orange',
    description: 'Wait for a period of time'
  },
  integration: {
    label: 'Integration',
    icon: LinkIcon,
    color: 'indigo',
    description: 'Call external API'
  }
} as const;

// ============================================================================
// WorkflowBuilder Component
// ============================================================================

export default function WorkflowBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  // State
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Workflow data
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerEvent, setTriggerEvent] = useState('request_submitted');
  const [isActive, setIsActive] = useState(true);
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // UI state
  const [showNodePalette, setShowNodePalette] = useState(true);
  const [showValidation, setShowValidation] = useState(false);

  // Roles for autocomplete
  const [roles, setRoles] = useState<Array<{ id: string; name: string }>>([]);

  // ============================================================================
  // Load workflow (if editing)
  // ============================================================================

  useEffect(() => {
    if (isEditMode) {
      fetchWorkflow();
    }
  }, [id]);

  // Fetch roles for autocomplete
  useEffect(() => {
    fetchRoles();
  }, []);

  const getAuthToken = () => {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Authentication required');
    return token;
  };

  const fetchRoles = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch('/api/roles-open', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error?.message || 'Failed to load roles');
      }

      // Map to simple format for autocomplete
      const roleList = data.data.map((role: any) => ({
        id: role.id,
        name: role.name
      }));
      setRoles(roleList);
    } catch (err: any) {
      console.error('Failed to load roles:', err);
      // Don't block the UI if roles fail to load
    }
  };

  const fetchWorkflow = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const response = await fetch(`/api/workflows/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error?.message || data?.message || 'Failed to load workflow');
      }

      const workflow = data.data;
      console.log('Loading workflow:', workflow);
      console.log('Workflow JSON:', workflow.workflow_json);
      console.log('Nodes:', workflow.workflow_json?.nodes);

      setName(workflow.name);
      setDescription(workflow.description || '');
      setTriggerEvent(workflow.trigger_event);
      setIsActive(workflow.is_active);
      setNodes(workflow.workflow_json?.nodes || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // Node Operations
  // ============================================================================

  const addNode = (type: WorkflowNode['type']) => {
    const newNode: WorkflowNode = {
      id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      label: `${NODE_TYPES[type].label} ${nodes.length + 1}`,
      position: { x: 100, y: nodes.length * 120 + 100 },
      config: getDefaultConfig(type),
      next: undefined
    };

    setNodes([...nodes, newNode]);
    setSelectedNodeId(newNode.id);
  };

  const getDefaultConfig = (type: WorkflowNode['type']): any => {
    switch (type) {
      case 'start':
        return {};
      case 'end':
        return { finalStatus: 'completed' };
      case 'decision':
        return { condition: '', trueNodeId: '', falseNodeId: '' };
      case 'action':
        return { action: 'auto_approve', metadata: {} };
      case 'assignment':
        return {
          assignTo: '',
          slaHours: 24,
          allowedActions: ['approve', 'reject'],
          taskType: 'approve_request'
        };
      case 'notification':
        return {
          channel: 'in_app',
          sendTo: '',
          template: 'request_submitted',
          metadata: {}
        };
      case 'delay':
        return { delayType: 'hours', delayValue: 24 };
      case 'integration':
        return {
          method: 'POST',
          url: '',
          responseKey: 'result',
          timeoutMs: 30000
        };
      default:
        return {};
    }
  };

  const updateNode = (nodeId: string, updates: Partial<WorkflowNode>) => {
    setNodes(nodes.map(node =>
      node.id === nodeId ? { ...node, ...updates } : node
    ));
  };

  const deleteNode = (nodeId: string) => {
    setNodes(nodes.filter(node => node.id !== nodeId));
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
  };

  const moveNodeUp = (index: number) => {
    if (index === 0) return;
    const newNodes = [...nodes];
    [newNodes[index - 1], newNodes[index]] = [newNodes[index], newNodes[index - 1]];
    setNodes(newNodes);
  };

  const moveNodeDown = (index: number) => {
    if (index === nodes.length - 1) return;
    const newNodes = [...nodes];
    [newNodes[index], newNodes[index + 1]] = [newNodes[index + 1], newNodes[index]];
    setNodes(newNodes);
  };

  // ============================================================================
  // Validation
  // ============================================================================

  const validateWorkflow = (): string[] => {
    const errors: string[] = [];

    if (!name.trim()) errors.push('Workflow name is required');
    if (nodes.length === 0) errors.push('Workflow must have at least one node');

    // Validate each node
    nodes.forEach((node, index) => {
      const nodeLabel = node.label || `Node ${index + 1}`;

      if (node.type === 'decision') {
        if (!node.config.condition) {
          errors.push(`${nodeLabel}: Condition is required`);
        }
      }

      if (node.type === 'action') {
        if (!node.config.action) {
          errors.push(`${nodeLabel}: Action type is required`);
        }
      }

      if (node.type === 'assignment') {
        if (!node.config.assignTo) {
          errors.push(`${nodeLabel}: Assignment target is required`);
        }
        if (!node.config.allowedActions || node.config.allowedActions.length === 0) {
          errors.push(`${nodeLabel}: At least one allowed action is required`);
        }
      }

      if (node.type === 'notification') {
        if (!node.config.sendTo) {
          errors.push(`${nodeLabel}: Notification recipient is required`);
        }
        if (!node.config.template) {
          errors.push(`${nodeLabel}: Notification template is required`);
        }
      }

      if (node.type === 'delay') {
        if (node.config.delayType !== 'until' && !node.config.delayValue) {
          errors.push(`${nodeLabel}: Delay duration is required`);
        }
      }

      if (node.type === 'integration') {
        if (!node.config.url) {
          errors.push(`${nodeLabel}: API URL is required`);
        }
      }
    });

    return errors;
  };

  // ============================================================================
  // Save Workflow
  // ============================================================================

  const handleSave = async () => {
    // Validate
    const errors = validateWorkflow();
    setValidationErrors(errors);

    if (errors.length > 0) {
      setShowValidation(true);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const token = getAuthToken();

      const workflowData = {
        name,
        description,
        triggerEvent,
        isActive,
        appliesTo: null,
        workflowJson: {
          name,
          description,
          triggerEvent,
          appliesTo: null,
          nodes
        }
      };

      const response = await fetch(
        isEditMode ? `/api/workflows/${id}` : '/api/workflows',
        {
          method: isEditMode ? 'PUT' : 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(workflowData)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error?.message || data?.message || 'Failed to save workflow');
      }

      // Success - navigate back to list
      navigate('/admin/workflows');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ============================================================================
  // Test Workflow
  // ============================================================================

  const handleTest = async () => {
    const errors = validateWorkflow();
    setValidationErrors(errors);

    if (errors.length > 0) {
      setShowValidation(true);
      return;
    }

    if (!isEditMode) {
      alert('Please save the workflow before testing');
      return;
    }

    navigate(`/admin/workflows/${id}/test`);
  };

  // ============================================================================
  // Render
  // ============================================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-slate-600">Loading workflow...</p>
        </div>
      </div>
    );
  }

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Workflow Name"
                className="text-2xl font-bold text-slate-900 border-none focus:ring-0 focus:outline-none w-full bg-transparent"
              />
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)"
                className="text-sm text-slate-600 border-none focus:ring-0 focus:outline-none w-full bg-transparent mt-1"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/admin/workflows')}
                className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>

              {isEditMode && (
                <button
                  onClick={handleTest}
                  className="px-4 py-2 text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Test
                </button>
              )}

              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>

          {/* Workflow Settings */}
          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700">Trigger:</label>
              <select
                value={triggerEvent}
                onChange={(e) => setTriggerEvent(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="request_submitted">Request Submitted</option>
                <option value="pr_created">PR Created</option>
                <option value="stock_low">Stock Low</option>
                <option value="manual">Manual</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-slate-700">Active</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Error Messages */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        </div>
      )}

      {/* Validation Errors */}
      {showValidation && validationErrors.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-yellow-900 mb-2">Validation Errors</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
                  {validationErrors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => setShowValidation(false)}
                className="text-yellow-600 hover:text-yellow-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Node Palette */}
          <div className="col-span-3">
            <div className="bg-white rounded-lg border border-slate-200 sticky top-24">
              <button
                onClick={() => setShowNodePalette(!showNodePalette)}
                className="w-full px-4 py-3 flex items-center justify-between border-b border-slate-200"
              >
                <h3 className="font-semibold text-slate-900">Node Types</h3>
                {showNodePalette ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showNodePalette && (
                <div className="p-4 space-y-2">
                  {Object.entries(NODE_TYPES).map(([type, meta]) => {
                    const Icon = meta.icon;
                    return (
                      <button
                        key={type}
                        onClick={() => addNode(type as WorkflowNode['type'])}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition text-left"
                      >
                        <Icon className={`w-5 h-5 text-${meta.color}-600`} />
                        <div>
                          <div className="text-sm font-medium text-slate-900">{meta.label}</div>
                          <div className="text-xs text-slate-600">{meta.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Workflow Canvas */}
          <div className="col-span-6">
            <div className="bg-white rounded-lg border border-slate-200 p-6 min-h-[600px]">
              <h3 className="font-semibold text-slate-900 mb-4">Workflow Steps</h3>

              {nodes.length === 0 ? (
                <div className="text-center py-12">
                  <Plus className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600 mb-2">No nodes yet</p>
                  <p className="text-sm text-slate-500">Add nodes from the palette on the left</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {nodes.map((node, index) => {
                    const meta = NODE_TYPES[node.type];
                    if (!meta) {
                      console.warn(`Unknown node type: ${node.type}`, node);
                      return null;
                    }
                    const Icon = meta.icon;
                    const isSelected = selectedNodeId === node.id;

                    return (
                      <div
                        key={node.id}
                        onClick={() => setSelectedNodeId(node.id)}
                        className={`relative border-2 rounded-lg p-4 cursor-pointer transition ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Icon className={`w-5 h-5 text-${meta.color}-600`} />
                            <div>
                              <div className="font-medium text-slate-900">{node.label}</div>
                              <div className="text-xs text-slate-600">{meta.label}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                moveNodeUp(index);
                              }}
                              disabled={index === 0}
                              className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                            >
                              <ChevronUp className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                moveNodeDown(index);
                              }}
                              disabled={index === nodes.length - 1}
                              className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNode(node.id);
                              }}
                              className="p-1 text-red-400 hover:text-red-600 ml-2"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Node Configuration Panel */}
          <div className="col-span-3">
            <div className="bg-white rounded-lg border border-slate-200 sticky top-24">
              <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2">
                <Settings className="w-4 h-4 text-slate-600" />
                <h3 className="font-semibold text-slate-900">Configuration</h3>
              </div>

              <div className="p-4">
                {selectedNode ? (
                  <NodeConfigPanel
                    node={selectedNode}
                    onChange={(updates) => updateNode(selectedNode.id, updates)}
                    availableNodes={nodes.filter(n => n.id !== selectedNode.id)}
                    roles={roles}
                  />
                ) : (
                  <p className="text-sm text-slate-600 text-center py-8">
                    Select a node to configure
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Searchable Role Dropdown Component
// ============================================================================

function RoleDropdown({
  value,
  onChange,
  roles,
  placeholder = 'Select a role...'
}: {
  value: string;
  onChange: (value: string) => void;
  roles: Array<{ id: string; name: string }>;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get display name from value
  const getDisplayName = () => {
    if (!value) return placeholder;
    const roleId = value.replace('role:', '');
    const role = roles.find(r => r.id === roleId);
    return role ? role.name : placeholder;
  };

  // Filter roles based on search
  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-left focus:ring-2 focus:ring-blue-500 bg-white hover:bg-slate-50"
      >
        {getDisplayName()}
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg">
          <div className="p-2 border-b border-slate-200">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search roles..."
              className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredRoles.length === 0 ? (
              <div className="px-3 py-2 text-sm text-slate-500 text-center">
                No roles found
              </div>
            ) : (
              filteredRoles.map(role => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => {
                    onChange(`role:${role.id}`);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className="w-full px-3 py-2 text-sm text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                >
                  {role.name}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Node Configuration Panel
// ============================================================================

function NodeConfigPanel({
  node,
  onChange,
  availableNodes,
  roles
}: {
  node: WorkflowNode;
  onChange: (updates: Partial<WorkflowNode>) => void;
  availableNodes: WorkflowNode[];
  roles: Array<{ id: string; name: string }>;
}) {
  const updateConfig = (configUpdates: any) => {
    onChange({ config: { ...node.config, ...configUpdates } });
  };

  return (
    <div className="space-y-4">
      {/* Node Label */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Label</label>
        <input
          type="text"
          value={node.label || ''}
          onChange={(e) => onChange({ label: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Type-specific configuration */}
      {node.type === 'start' && (
        <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
          <p className="text-sm text-emerald-700">
            This is the workflow entry point. It triggers when the specified event occurs.
          </p>
        </div>
      )}

      {node.type === 'end' && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Final Status</label>
          <input
            type="text"
            value={node.config.finalStatus || 'completed'}
            onChange={(e) => updateConfig({ finalStatus: e.target.value })}
            placeholder="e.g., approved, rejected, completed"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-slate-500 mt-1">The final status to set when workflow completes</p>
        </div>
      )}

      {node.type === 'decision' && (
        <>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Condition</label>
            <textarea
              value={node.config.condition || ''}
              onChange={(e) => updateConfig({ condition: e.target.value })}
              placeholder="e.g., totalValue > 1000"
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 font-mono"
            />
            <p className="text-xs text-slate-500 mt-1">JavaScript expression</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">If True → Go To</label>
            <select
              value={node.config.trueNodeId || ''}
              onChange={(e) => updateConfig({ trueNodeId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select node...</option>
              {availableNodes.map(n => (
                <option key={n.id} value={n.id}>{n.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">If False → Go To</label>
            <select
              value={node.config.falseNodeId || ''}
              onChange={(e) => updateConfig({ falseNodeId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select node...</option>
              {availableNodes.map(n => (
                <option key={n.id} value={n.id}>{n.label}</option>
              ))}
            </select>
          </div>
        </>
      )}

      {node.type === 'action' && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Action Type</label>
          <select
            value={node.config.action || 'auto_approve'}
            onChange={(e) => updateConfig({ action: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="auto_approve">Auto Approve</option>
            <option value="auto_reject">Auto Reject</option>
            <option value="fulfill_request">Fulfill Request</option>
            <option value="create_pr">Create PR</option>
            <option value="reserve_stock">Reserve Stock</option>
            <option value="update_status">Update Status</option>
          </select>
        </div>
      )}

      {node.type === 'assignment' && (
        <>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Assign To Role</label>
            <RoleDropdown
              value={node.config.assignTo || ''}
              onChange={(value) => updateConfig({ assignTo: value })}
              roles={roles}
              placeholder="Select a role..."
            />
            <p className="text-xs text-slate-500 mt-1">
              Task will be assigned to users with this role
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">SLA (hours)</label>
            <input
              type="number"
              value={node.config.slaHours || 24}
              onChange={(e) => updateConfig({ slaHours: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Task Type</label>
            <select
              value={node.config.taskType || 'approve_request'}
              onChange={(e) => updateConfig({ taskType: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="approve_request">Approve Request</option>
              <option value="reject_request">Reject Request</option>
              <option value="review_request">Review Request</option>
              <option value="fulfill_request">Fulfill Request</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </>
      )}

      {node.type === 'notification' && (
        <>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Channel</label>
            <select
              value={node.config.channel || 'in_app'}
              onChange={(e) => updateConfig({ channel: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="in_app">In-App</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="slack">Slack</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Send To Role</label>
            <RoleDropdown
              value={node.config.sendTo || ''}
              onChange={(value) => updateConfig({ sendTo: value })}
              roles={roles}
              placeholder="Select a role..."
            />
            <p className="text-xs text-slate-500 mt-1">
              Notification will be sent to users with this role
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Template</label>
            <input
              type="text"
              value={node.config.template || ''}
              onChange={(e) => updateConfig({ template: e.target.value })}
              placeholder="Template name"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </>
      )}

      {node.type === 'delay' && (
        <>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Delay Type</label>
            <select
              value={node.config.delayType || 'hours'}
              onChange={(e) => updateConfig({ delayType: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="hours">Hours</option>
              <option value="days">Days</option>
              <option value="until">Until Date/Time</option>
            </select>
          </div>

          {(node.config.delayType === 'hours' || node.config.delayType === 'days') && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Duration</label>
              <input
                type="number"
                value={node.config.delayValue || 24}
                onChange={(e) => updateConfig({ delayValue: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </>
      )}

      {node.type === 'integration' && (
        <>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Method</label>
            <select
              value={node.config.method || 'POST'}
              onChange={(e) => updateConfig({ method: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">API URL</label>
            <input
              type="text"
              value={node.config.url || ''}
              onChange={(e) => updateConfig({ url: e.target.value })}
              placeholder="https://api.example.com/endpoint"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Response Key</label>
            <input
              type="text"
              value={node.config.responseKey || 'result'}
              onChange={(e) => updateConfig({ responseKey: e.target.value })}
              placeholder="Variable name to store response"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </>
      )}

      {/* Next Node (for non-decision and non-end nodes) */}
      {node.type !== 'decision' && node.type !== 'end' && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Next Node</label>
          <select
            value={node.next || ''}
            onChange={(e) => onChange({ next: e.target.value || undefined })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">End workflow</option>
            {availableNodes.map(n => (
              <option key={n.id} value={n.id}>{n.label}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
