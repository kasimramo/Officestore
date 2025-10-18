import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, AlertCircle, ChevronDown, ChevronRight, Shield, User as UserIcon } from 'lucide-react';

interface Role {
  id: string;
  name: string;
  description: string;
}

interface ApprovalLevel {
  id?: string;
  level_order: number;
  role_id: string;
  role_name?: string;
}

interface Workflow {
  id?: string;
  name: string;
  description: string;
  trigger_type: string;
  trigger_conditions?: any;
  is_default: boolean;
  is_active?: boolean;
  version?: number;
  levels: ApprovalLevel[];
}

type TriggerType = 'request_submitted' | 'procurement' | 'fulfillment';

const TRIGGER_TYPES: Record<TriggerType, { label: string; description: string }> = {
  request_submitted: {
    label: 'New Request Submission',
    description: 'Workflows triggered when a new request is submitted'
  },
  procurement: {
    label: 'Procurement Process',
    description: 'Workflows for procurement approval stages'
  },
  fulfillment: {
    label: 'Fulfillment Process',
    description: 'Workflows for fulfillment and delivery stages'
  }
};

export default function ApprovalWorkflows() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['request_submitted']));

  // Fetch roles
  useEffect(() => {
    fetch(`/api/roles?t=${Date.now()}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        'Cache-Control': 'no-cache'
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load roles');
        return res.json();
      })
      .then(response => {
        const rolesData = response.success ? response.data : response;
        setRoles(Array.isArray(rolesData) ? rolesData : []);
      })
      .catch(err => {
        console.error('Fetch roles error:', err);
        setError('Failed to load roles');
      });
  }, []);

  // Fetch workflows
  const fetchWorkflows = async () => {
    try {
      const response = await fetch(`/api/workflows?t=${Date.now()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) throw new Error('Failed to load workflows');

      const payload = await response.json();
      const list = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
      setWorkflows(list);
    } catch (err) {
      console.error('Fetch workflows error:', err);
      setError('Failed to load workflows');
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const toggleSection = (triggerType: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(triggerType)) {
        newSet.delete(triggerType);
      } else {
        newSet.add(triggerType);
      }
      return newSet;
    });
  };

  const handleCreateWorkflow = (triggerType: string) => {
    const newWorkflow: Workflow = {
      name: 'New Workflow',
      description: '',
      trigger_type: triggerType,
      trigger_conditions: {},
      is_default: false, // User-defined workflows are never default
      levels: []
    };
    setSelectedWorkflow(newWorkflow);
    setIsEditing(true);
  };

  const handleAddLevel = () => {
    if (!selectedWorkflow) return;

    const newLevel: ApprovalLevel = {
      level_order: selectedWorkflow.levels.length + 1,
      role_id: roles[0]?.id || ''
    };

    setSelectedWorkflow({
      ...selectedWorkflow,
      levels: [...selectedWorkflow.levels, newLevel]
    });
  };

  const handleRemoveLevel = (index: number) => {
    if (!selectedWorkflow) return;

    const updatedLevels = selectedWorkflow.levels
      .filter((_, i) => i !== index)
      .map((level, i) => ({ ...level, level_order: i + 1 }));

    setSelectedWorkflow({
      ...selectedWorkflow,
      levels: updatedLevels
    });
  };

  const handleUpdateLevel = (index: number, role_id: string) => {
    if (!selectedWorkflow) return;

    const updatedLevels = [...selectedWorkflow.levels];
    updatedLevels[index] = { ...updatedLevels[index], role_id };

    setSelectedWorkflow({
      ...selectedWorkflow,
      levels: updatedLevels
    });
  };

  const handleSaveWorkflow = async () => {
    if (!selectedWorkflow) return;

    setError(null);
    setSuccess(null);

    // Validation
    if (!selectedWorkflow.name.trim()) {
      setError('Workflow name is required');
      return;
    }

    if (selectedWorkflow.levels.length === 0) {
      setError('At least one approval level is required');
      return;
    }

    try {
      const method = selectedWorkflow.id ? 'PUT' : 'POST';
      const url = selectedWorkflow.id
        ? `/api/workflows/${selectedWorkflow.id}`
        : '/api/workflows';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(selectedWorkflow)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save workflow');
      }

      const savedWorkflow = await response.json();

      // Refresh workflows list
      await fetchWorkflows();

      setSelectedWorkflow(null);
      setIsEditing(false);
      setSuccess('Workflow saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save workflow');
    }
  };

  const getRoleName = (role_id: string) => {
    return roles.find(r => r.id === role_id)?.name || 'Unknown Role';
  };

  const handleActivateWorkflow = async (workflowId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/workflows/${workflowId}/activate`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ is_active: !currentStatus })
      });

      if (!response.ok) throw new Error('Failed to toggle workflow');

      await fetchWorkflows();
      setSuccess(`Workflow ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to toggle workflow');
      setTimeout(() => setError(null), 3000);
    }
  };

  // Group workflows by trigger type
  const workflowsByTrigger = Object.keys(TRIGGER_TYPES).reduce((acc, triggerType) => {
    acc[triggerType] = workflows.filter(w => w.trigger_type === triggerType);
    return acc;
  }, {} as Record<string, Workflow[]>);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Approval Workflows</h1>
            <p className="text-slate-600 mt-2">
              Manage approval levels for different trigger events
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Workflows List - Organized by Trigger Type */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Workflows by Trigger Event</h2>
            </div>

            <div className="divide-y divide-slate-200">
              {(Object.keys(TRIGGER_TYPES) as TriggerType[]).map(triggerType => {
                const isExpanded = expandedSections.has(triggerType);
                const triggerWorkflows = workflowsByTrigger[triggerType] || [];
                const activeWorkflow = triggerWorkflows.find(w => w.is_active);

                return (
                  <div key={triggerType} className="border-b border-slate-100 last:border-b-0">
                    {/* Section Header */}
                    <div
                      className="px-6 py-4 cursor-pointer hover:bg-slate-50 transition-colors"
                      onClick={() => toggleSection(triggerType)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-slate-500" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-slate-500" />
                          )}
                          <div>
                            <h3 className="font-medium text-slate-900">
                              {TRIGGER_TYPES[triggerType].label}
                            </h3>
                            <p className="text-xs text-slate-600 mt-0.5">
                              {triggerWorkflows.length} workflow(s)
                              {activeWorkflow && <span className="text-green-600"> • 1 active</span>}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreateWorkflow(triggerType);
                          }}
                          className="flex items-center gap-1 text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700"
                        >
                          <Plus className="w-3 h-3" />
                          New
                        </button>
                      </div>
                    </div>

                    {/* Workflows for this trigger */}
                    {isExpanded && (
                      <div className="px-6 pb-4 space-y-2">
                        {triggerWorkflows.length === 0 ? (
                          <div className="text-center text-slate-500 py-6 text-sm">
                            No workflows for this trigger yet
                          </div>
                        ) : (
                          triggerWorkflows.map(workflow => (
                            <div
                              key={workflow.id}
                              className={`p-3 rounded-lg border transition-all ${
                                selectedWorkflow?.id === workflow.id
                                  ? 'bg-blue-50 border-blue-300 shadow-sm'
                                  : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div
                                className="cursor-pointer"
                                onClick={() => {
                                  setSelectedWorkflow(workflow);
                                  setIsEditing(false);
                                }}
                              >
                                <div className="font-medium text-slate-900 mb-2">{workflow.name}</div>
                                <div className="flex items-center gap-2 flex-wrap mb-2">
                                  {workflow.is_default ? (
                                    <span className="inline-flex items-center gap-1 text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-medium">
                                      <Shield className="w-3 h-3" />
                                      System Default
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-medium">
                                      <UserIcon className="w-3 h-3" />
                                      User Defined
                                    </span>
                                  )}
                                  {workflow.is_active ? (
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded font-medium">Active</span>
                                  ) : (
                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Inactive</span>
                                  )}
                                  {workflow.version && (
                                    <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">v{workflow.version}</span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-600">
                                  {workflow.levels?.length || 0} approval level(s)
                                </div>
                              </div>
                              <div className="mt-3 flex gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleActivateWorkflow(workflow.id!, workflow.is_active || false);
                                  }}
                                  disabled={workflow.is_default && workflow.is_active}
                                  className={`flex-1 text-xs px-3 py-1.5 rounded transition-colors ${
                                    workflow.is_active
                                      ? workflow.is_default
                                        ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                      : 'bg-green-600 text-white hover:bg-green-700'
                                  }`}
                                  title={workflow.is_default && workflow.is_active ? 'System default is always active' : ''}
                                >
                                  {workflow.is_active ? 'Deactivate' : 'Activate'}
                                </button>
                                {!workflow.is_default && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedWorkflow(workflow);
                                      setIsEditing(true);
                                    }}
                                    className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
                                  >
                                    Edit
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Workflow Editor */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            {selectedWorkflow ? (
              <>
                <div className="flex justify-between items-center mb-6">
                  <div className="flex-1">
                    {isEditing ? (
                      <input
                        type="text"
                        value={selectedWorkflow.name}
                        onChange={(e) => setSelectedWorkflow({
                          ...selectedWorkflow,
                          name: e.target.value
                        })}
                        className="text-2xl font-bold text-slate-900 border-b-2 border-blue-500 focus:outline-none w-full"
                        placeholder="Workflow Name"
                      />
                    ) : (
                      <div>
                        <h2 className="text-2xl font-bold text-slate-900">{selectedWorkflow.name}</h2>
                        <div className="mt-2 flex items-center gap-2">
                          {selectedWorkflow.is_default ? (
                            <span className="inline-flex items-center gap-1 text-sm bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full font-medium">
                              <Shield className="w-4 h-4" />
                              System Default
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-sm bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-medium">
                              <UserIcon className="w-4 h-4" />
                              User Defined
                            </span>
                          )}
                          <span className="text-sm text-slate-600">
                            • {TRIGGER_TYPES[selectedWorkflow.trigger_type as TriggerType]?.label || selectedWorkflow.trigger_type}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  {isEditing && !selectedWorkflow.is_default && (
                    <button
                      onClick={handleSaveWorkflow}
                      className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 ml-4"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                  )}
                </div>

                {selectedWorkflow.is_default && (
                  <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Shield className="w-5 h-5 text-indigo-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-indigo-900 mb-1">System Default Workflow</h4>
                        <p className="text-sm text-indigo-800">
                          This workflow is created automatically when your organization is set up. It cannot be edited or deleted,
                          but you can create custom workflows to replace it.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {isEditing && !selectedWorkflow.is_default && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={selectedWorkflow.description || ''}
                      onChange={(e) => setSelectedWorkflow({
                        ...selectedWorkflow,
                        description: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      placeholder="Brief description of this workflow..."
                    />
                  </div>
                )}

                {!isEditing && selectedWorkflow.description && (
                  <div className="mb-6">
                    <p className="text-slate-700">{selectedWorkflow.description}</p>
                  </div>
                )}

                <div className="mb-4 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-slate-900">Approval Levels</h3>
                  {isEditing && !selectedWorkflow.is_default && (
                    <button
                      onClick={handleAddLevel}
                      className="flex items-center gap-2 bg-slate-100 text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-200"
                    >
                      <Plus className="w-4 h-4" />
                      Add Level
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {selectedWorkflow.levels.map((level, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <div className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full font-bold">
                        {level.level_order}
                      </div>

                      <div className="flex-1">
                        {isEditing && !selectedWorkflow.is_default ? (
                          <select
                            value={level.role_id}
                            onChange={(e) => handleUpdateLevel(index, e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {roles.map(role => (
                              <option key={role.id} value={role.id}>
                                {role.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div>
                            <div className="font-medium text-slate-900">
                              {getRoleName(level.role_id)}
                            </div>
                            <div className="text-sm text-slate-600">
                              Level {level.level_order} Approver
                            </div>
                          </div>
                        )}
                      </div>

                      {isEditing && !selectedWorkflow.is_default && (
                        <button
                          onClick={() => handleRemoveLevel(index)}
                          className="text-red-600 hover:text-red-700 p-2"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}

                  {selectedWorkflow.levels.length === 0 && (
                    <div className="text-center text-slate-500 py-8 border-2 border-dashed border-slate-200 rounded-lg">
                      No approval levels yet. Click "Add Level" to create one.
                    </div>
                  )}
                </div>

                {!isEditing && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">How it works:</h4>
                    <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                      <li>When triggered, approval starts at Level 1</li>
                      <li>Once Level 1 approves, it moves to Level 2</li>
                      <li>This continues sequentially until all levels approve</li>
                      <li>If any level rejects, the workflow stops</li>
                      <li>Only ONE workflow can be active per trigger type</li>
                    </ol>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-slate-500 py-16">
                <p className="text-lg mb-2">Select a workflow to view details</p>
                <p className="text-sm">Or create a new workflow for any trigger event</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
