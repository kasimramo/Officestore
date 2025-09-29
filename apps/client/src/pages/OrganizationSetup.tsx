import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function OrganizationSetup() {
  const [formData, setFormData] = useState({
    organizationName: '',
    description: '',
    industry: '',
    size: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { user, setOrg } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Create organization and set user as admin
      const newOrg = {
        id: Math.random().toString(36).substr(2, 9),
        name: formData.organizationName,
        slug: formData.organizationName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      }

      setOrg(newOrg)
      localStorage.removeItem('pending_org_setup')

      // Update user with organization ID
      if (user) {
        const updatedUser = { ...user, organizationId: newOrg.id }
        localStorage.setItem('user', JSON.stringify(updatedUser))
      }

      navigate('/admin-dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Organization setup failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-lg bg-white rounded-xl border border-slate-200 p-8 shadow-lg">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center rounded-lg bg-blue-600 text-white w-10 h-10 font-bold text-lg">OS</span>
            <span className="font-bold text-xl text-slate-900">OfficeStore</span>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900">Setup Your Organization</h2>
            <p className="text-sm text-slate-600 mt-2">
              Welcome {user?.firstName}! Let's set up your organization and make you the administrator.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="organizationName" className="block text-sm font-medium text-slate-700 mb-1">
                Organization Name *
              </label>
              <input
                id="organizationName"
                name="organizationName"
                type="text"
                value={formData.organizationName}
                onChange={handleInputChange}
                placeholder="Acme Corporation"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Brief description of your organization"
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="industry" className="block text-sm font-medium text-slate-700 mb-1">
                Industry
              </label>
              <select
                id="industry"
                name="industry"
                value={formData.industry}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select industry</option>
                <option value="technology">Technology</option>
                <option value="healthcare">Healthcare</option>
                <option value="finance">Finance</option>
                <option value="manufacturing">Manufacturing</option>
                <option value="retail">Retail</option>
                <option value="education">Education</option>
                <option value="government">Government</option>
                <option value="nonprofit">Non-profit</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="size" className="block text-sm font-medium text-slate-700 mb-1">
                Organization Size
              </label>
              <select
                id="size"
                name="size"
                value={formData.size}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select size</option>
                <option value="1-10">1-10 employees</option>
                <option value="11-50">11-50 employees</option>
                <option value="51-200">51-200 employees</option>
                <option value="201-500">201-500 employees</option>
                <option value="501-1000">501-1000 employees</option>
                <option value="1000+">1000+ employees</option>
              </select>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-md">
              <h4 className="text-sm font-medium text-blue-900 mb-1">Administrator Role</h4>
              <p className="text-sm text-blue-700">
                You will become the administrator of this organization with full access to:
              </p>
              <ul className="text-sm text-blue-700 mt-2 list-disc list-inside space-y-1">
                <li>Manage sites and areas</li>
                <li>Create and manage user accounts</li>
                <li>Oversee all requests and approvals</li>
                <li>Access analytics and reports</li>
                <li>Configure organization settings</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={isLoading || !formData.organizationName}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Setting up organization...' : 'Complete Setup'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}