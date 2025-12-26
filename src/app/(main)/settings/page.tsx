'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface UserSettings {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  notifyEmail: boolean;
  notifySms: boolean;
}

// Toggle switch component
function Toggle({
  checked,
  onChange
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
        checked ? 'bg-[#4a7c59]' : 'bg-neutral-200'
      }`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifySms, setNotifySms] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/user/settings');
      const data = await res.json();
      setSettings(data);
      setName(data.name || '');
      setPhone(data.phone || '');
      setNotifyEmail(data.notifyEmail);
      setNotifySms(data.notifySms);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError('');

    try {
      const res = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name || undefined,
          phone: phone || null,
          notifyEmail,
          notifySms,
        }),
      });

      if (res.ok) {
        setSaved(true);
        fetchSettings();
        // Clear saved message after 3 seconds
        setTimeout(() => setSaved(false), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save settings');
      }
    } catch {
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⚙️</div>
          <p className="text-neutral-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#1f1a17] mb-1">
          Settings
        </h1>
        <p className="text-[15px] text-neutral-500">
          Manage how GreatReads works for you.
        </p>
      </div>

      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6 space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-[#1f1a17] mb-1">
            Profile
          </h2>
          <p className="text-sm text-neutral-500">
            How your name appears to friends.
          </p>
        </div>

        <div className="space-y-4">
          <Input
            label="Display name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Mark"
          />

          <div>
            <label className="block text-sm font-medium text-[#1f1a17] mb-1.5">
              Email
            </label>
            <p className="text-[15px] text-neutral-600 mb-1">
              {settings?.email}
            </p>
            <p className="text-xs text-neutral-400">
              Used for sign-in and notifications.
            </p>
          </div>
        </div>
      </div>

      {/* Notifications card */}
      <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6 space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-[#1f1a17] mb-1">
            Notifications
          </h2>
          <p className="text-sm text-neutral-500">
            Choose how you want to hear about great books.
          </p>
        </div>

        <div className="space-y-4">
          {/* Email notifications */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-[15px] font-medium text-[#1f1a17] mb-0.5">
                Email me when a friend gives a book 5 stars
              </p>
              <p className="text-sm text-neutral-500">
                You&apos;ll get a short note with the book and who loved it.
              </p>
            </div>
            <Toggle checked={notifyEmail} onChange={setNotifyEmail} />
          </div>

          {/* SMS notifications */}
          <div className="pt-4 border-t border-black/5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-[15px] font-medium text-[#1f1a17] mb-0.5">
                  Text me about new picks
                </p>
                <p className="text-sm text-neutral-500">
                  Requires a phone number.
                </p>
              </div>
              <Toggle checked={notifySms} onChange={setNotifySms} />
            </div>

            {/* Phone number input - shown when SMS is enabled */}
            {notifySms && (
              <div className="mt-4 pl-0 animate-fadeIn">
                <Input
                  label="Phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  type="tel"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save section */}
      <div className="flex items-center justify-end gap-4">
        {saved && (
          <p className="text-sm text-emerald-600 animate-fadeIn">
            Changes saved
          </p>
        )}
        {error && (
          <p className="text-sm text-red-600">
            {error}
          </p>
        )}
        <Button onClick={handleSave} loading={saving}>
          Save Changes
        </Button>
      </div>

      {/* Account / Danger Zone card */}
      <div className="bg-red-50/50 rounded-2xl border border-red-100 p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-red-700 mb-1">
            Delete account
          </h2>
          <p className="text-sm text-red-600/70">
            This permanently deletes your account and all your reading data.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          className="border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300"
        >
          Delete account
        </Button>
      </div>

      {/* Quiet footer note */}
      <p className="text-center text-sm text-neutral-300 italic pb-4">
        GreatReads is built to stay out of the way.
      </p>
    </div>
  );
}
