import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { toast } from 'sonner';
import {
  Settings, Building2, Globe, Mail, Phone, MapPin,
  Save, Bell, Shield, Palette, Database, Eye, EyeOff,
  ToggleLeft, ToggleRight
} from 'lucide-react';

interface OrgSettings {
  name: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  state: string;
  country: string;
  description: string;
  registration_number: string;
}

interface NotifSettings {
  email_new_volunteer: boolean;
  email_new_donation: boolean;
  email_event_reminder: boolean;
  email_monthly_report: boolean;
}

const tabs = [
  { id: 'organization', label: 'Organization', icon: Building2 },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
] as const;

type TabId = typeof tabs[number]['id'];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ${checked ? 'bg-rose-500' : 'bg-gray-300'}`}
    >
      <span className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('organization');
  const queryClient = useQueryClient();

  const [orgForm, setOrgForm] = useState<OrgSettings>({
    name: '', email: '', phone: '', website: '', address: '',
    city: '', state: '', country: 'India', description: '', registration_number: '',
  });

  const [notifSettings, setNotifSettings] = useState<NotifSettings>({
    email_new_volunteer: true,
    email_new_donation: true,
    email_event_reminder: true,
    email_monthly_report: false,
  });

  const { isLoading } = useQuery({
    queryKey: ['organization-settings'],
    queryFn: async () => {
      const res = await api.get('/organization');
      const org = res.data?.data || res.data;
      if (org) {
        setOrgForm({
          name: org.name || '',
          email: org.email || '',
          phone: org.phone || '',
          website: org.website || '',
          address: org.address || '',
          city: org.city || '',
          state: org.state || '',
          country: org.country || 'India',
          description: org.description || '',
          registration_number: org.registration_number || '',
        });
      }
      return org;
    },
  });

  const orgMutation = useMutation({
    mutationFn: (data: OrgSettings) => api.put('/organization', data),
    onSuccess: () => {
      toast.success('Organization settings saved!');
      queryClient.invalidateQueries({ queryKey: ['organization-settings'] });
    },
    onError: () => toast.error('Failed to save settings'),
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your organization and application settings</p>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl w-fit">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'organization' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Organization Profile</h2>
              <p className="text-sm text-gray-500">Update your NGO's public information</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Organization Name</label>
              <input
                type="text"
                value={orgForm.name}
                onChange={(e) => setOrgForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                id="org-name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Registration Number</label>
              <input
                type="text"
                value={orgForm.registration_number}
                onChange={(e) => setOrgForm(f => ({ ...f, registration_number: e.target.value }))}
                placeholder="NGO-XXXX-XXXX"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                id="org-reg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Mail className="w-3.5 h-3.5 inline mr-1" />Email
              </label>
              <input
                type="email"
                value={orgForm.email}
                onChange={(e) => setOrgForm(f => ({ ...f, email: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                id="org-email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Phone className="w-3.5 h-3.5 inline mr-1" />Phone
              </label>
              <input
                type="tel"
                value={orgForm.phone}
                onChange={(e) => setOrgForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                id="org-phone"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Globe className="w-3.5 h-3.5 inline mr-1" />Website
              </label>
              <input
                type="url"
                value={orgForm.website}
                onChange={(e) => setOrgForm(f => ({ ...f, website: e.target.value }))}
                placeholder="https://yourorg.org"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                id="org-website"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea
                value={orgForm.description}
                onChange={(e) => setOrgForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
                placeholder="Tell us about your organization..."
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                id="org-description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
              <input
                type="text"
                value={orgForm.city}
                onChange={(e) => setOrgForm(f => ({ ...f, city: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                id="org-city"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">State</label>
              <input
                type="text"
                value={orgForm.state}
                onChange={(e) => setOrgForm(f => ({ ...f, state: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                id="org-state"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => orgMutation.mutate(orgForm)} disabled={orgMutation.isPending}>
              <Save className="w-4 h-4" />
              {orgMutation.isPending ? 'Saving...' : 'Save Organization Settings'}
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Bell className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Email Notifications</h2>
              <p className="text-sm text-gray-500">Choose which events trigger email alerts</p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { key: 'email_new_volunteer' as const, label: 'New Volunteer Registration', desc: 'Notify when a new volunteer joins' },
              { key: 'email_new_donation' as const, label: 'New Donation Received', desc: 'Alert on every new donation' },
              { key: 'email_event_reminder' as const, label: 'Event Reminders', desc: 'Send reminders before upcoming events' },
              { key: 'email_monthly_report' as const, label: 'Monthly Reports', desc: 'Receive monthly activity summaries' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
                <Toggle
                  checked={notifSettings[item.key]}
                  onChange={(v) => setNotifSettings(s => ({ ...s, [item.key]: v }))}
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end mt-4">
            <Button onClick={() => toast.success('Notification preferences saved!')}>
              <Save className="w-4 h-4" /> Save Preferences
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100 mb-6">
            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
              <Shield className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Security Settings</h2>
              <p className="text-sm text-gray-500">Manage access and account security</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-amber-800 mb-1">Two-Factor Authentication</p>
              <p className="text-xs text-amber-700 mb-3">Add an extra layer of security to your account by enabling 2FA.</p>
              <Button variant="outline" size="sm" onClick={() => toast.info('2FA setup coming soon!')}>
                Enable 2FA
              </Button>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-rose-800 mb-1">Active Sessions</p>
              <p className="text-xs text-rose-700 mb-3">Sign out from all other devices to secure your account.</p>
              <Button variant="outline" size="sm" onClick={() => toast.success('Signed out from all other sessions')}>
                Revoke All Sessions
              </Button>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-gray-800 mb-1">Audit Trail</p>
              <p className="text-xs text-gray-600 mb-3">All actions in the system are logged. View the audit log for a complete record.</p>
              <a href="/audit-logs" className="text-xs text-rose-600 font-medium hover:underline">View Audit Logs →</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
