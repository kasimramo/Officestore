import { useState, useEffect } from 'react';
import { Plus, Trash2, GripVertical, Save, AlertCircle } from 'lucide-react';

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
  levels: ApprovalLevel[];
}

export default function ApprovalWorkflows() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
        console.log('Roles API response:', response);
        const rolesData = response.success ? response.data : response;
        if (Array.isArray(rolesData)) {
          setRoles(rolesData);
        } else {
          console.error('Roles response is not an array:', response);
          setRoles([]);
        }
      })
      .catch(err => {
        console.error('Fetch roles error:', err);
        setError('Failed to load roles');
        setRoles([]);
      });
  }, []);

  // Fetch workflows
  useEffect(() => {
    fetch(`/api/workflows?t=${Date.now()}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        'Cache-Control': 'no-cache'
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load workflows');
        return res.json();
      })
      .then(payload => {
        console.log('Workflows API response:', payload);

        // Handle both plain array and { success, data } wrapper formats
        const list = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
            ? payload.data
            : [];

        if (list.length === 0 && !Array.isArray(payload) && !Array.isArray(payload?.data)) {
          console.error('Workflows response is not an array:', payload);
        }

        setWorkflows(list);
      })
      .catch(err => {
        console.error('Fetch workflows error:', err);
        setError('Failed to load workflows');
        setWorkflows([]);
      });
  }, []);

  const handleCreateWorkflow = () => {
    const newWorkflow: Workflow = {
      name: 'New Workflow',
      description: '',
      trigger_type: 'request',
      trigger_conditions: {},
      is_default: workflows.length === 0,
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

  const handleMoveLevel = (index: number, direction: 'up' | 'down') => {
    if (!selectedWorkflow) return;

    const levels = [...selectedWorkflow.levels];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;

    if (swapIndex < 0 || swapIndex >= levels.length) return;

    [levels[index], levels[swapIndex]] = [levels[swapIndex], levels[index]];

    // Update level_order
    const updatedLevels = levels.map((level, i) => ({
      ...level,
      level_order: i + 1
    }));

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
        throw new Error('Failed to save workflow');
      }

      const savedWorkflow = await response.json();

      // Update workflows list
      if (selectedWorkflow.id) {
        setWorkflows(workflows.map(w => w.id === savedWorkflow.id ? savedWorkflow : w));
      } else {
        setWorkflows([...workflows, savedWorkflow]);
      }

      setSuccess('Workflow saved successfully!');
      setIsEditing(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to save workflow');
    }
  };

  const getRoleName = (role_id: string) => {
    return roles.find(r => r.id === role_id)?.name || 'Unknown Role';
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Approval Workflows</h1>
            <p className="text-slate-600 mt-2">
              Manage approval levels for requests. Set up who approves at each level.
            </p>
          </div>
          <button
            onClick={handleCreateWorkflow}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            New Workflow
          </button>
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
          {/* Workflows List */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Workflows</h2>
            <div className="space-y-2">
              {workflows.map(workflow => (
                <button
                  key={workflow.id}
                  onClick={() => {
                    setSelectedWorkflow(workflow);
                    setIsEditing(false);
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedWorkflow?.id === workflow.id
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-medium text-slate-900">{workflow.name}</div>
                  {workflow.is_default && (
                    <div className="text-xs text-blue-600 mt-1">Default Workflow</div>
                  )}
                  <div className="text-sm text-slate-600 mt-1">
                    {workflow.levels?.length || 0} approval levels
                  </div>
                </button>
              ))}
              {workflows.length === 0 && (
                <div className="text-center text-slate-500 py-8">
                  No workflows yet. Create one to get started.
                </div>
              )}
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
                        <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          Triggers on: {selectedWorkflow.trigger_type === 'request' ? 'New Request Submission' :
                            selectedWorkflow.trigger_type === 'procurement' ? 'Procurement Process' :
                            selectedWorkflow.trigger_type === 'fulfillment' ? 'Fulfillment Process' : 'Manual'}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    {isEditing ? (
                      <button
                        onClick={handleSaveWorkflow}
                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </button>
                    ) : (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <>
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

                    <div className="mb-6">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Trigger Event
                      </label>
                      <select
                        value={selectedWorkflow.trigger_type}
                        onChange={(e) => setSelectedWorkflow({
                          ...selectedWorkflow,
                          trigger_type: e.target.value
                        })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="manual">Manual (triggered manually)</option>
                        <option value="request">New Request Submission</option>
                        <option value="procurement">Procurement Process</option>
                        <option value="fulfillment">Fulfillment Process</option>
                      </select>
                      <p className="text-sm text-slate-500 mt-1">
                        Select when this approval workflow should be triggered
                      </p>
                    </div>
                  </>
                )}

                <div className="mb-4 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-slate-900">Approval Levels</h3>
                  {isEditing && (
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
                      {isEditing && (
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => handleMoveLevel(index, 'up')}
                            disabled={index === 0}
                            className="text-slate-400 hover:text-slate-600 disabled:opacity-30"
                          >
                            <GripVertical className="w-5 h-5 rotate-90" />
                          </button>
                          <button
                            onClick={() => handleMoveLevel(index, 'down')}
                            disabled={index === selectedWorkflow.levels.length - 1}
                            className="text-slate-400 hover:text-slate-600 disabled:opacity-30"
                          >
                            <GripVertical className="w-5 h-5 rotate-90" />
                          </button>
                        </div>
                      )}

                      <div className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full font-bold">
                        {level.level_order}
                      </div>

                      <div className="flex-1">
                        {isEditing ? (
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

                      {isEditing && (
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
                      <li>When a request is submitted, it goes to Level 1 approver</li>
                      <li>Once Level 1 approves, it moves to Level 2</li>
                      <li>This continues until all levels approve</li>
                      <li>If any level rejects, the request is sent back to the requester</li>
                      <li>Notifications are sent automatically at each level</li>
                    </ol>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-slate-500 py-16">
                Select a workflow from the list or create a new one to get started.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
