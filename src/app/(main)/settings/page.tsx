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

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

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
    setMessage('');

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
        setMessage('Settings saved successfully!');
        fetchSettings();
      } else {
        const data = await res.json();
        setMessage(data.error || 'Failed to save settings');
      }
    } catch {
      setMessage('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin text-4xl">⚙️</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-serif font-bold text-[var(--color-brown-dark)] mb-6">
        Settings
      </h1>

      <div className="card p-6 space-y-6">
        {/* Profile section */}
        <div>
          <h2 className="text-lg font-serif font-bold text-[var(--color-brown-dark)] mb-4">
            Profile
          </h2>
          <div className="space-y-4">
            <Input
              label="Display Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
            <div>
              <label className="block text-sm font-medium text-[var(--color-brown-dark)] mb-1.5">
                Email
              </label>
              <p className="text-[var(--color-brown)]">{settings?.email}</p>
            </div>
          </div>
        </div>

        {/* Notifications section */}
        <div>
          <h2 className="text-lg font-serif font-bold text-[var(--color-brown-dark)] mb-4">
            Notifications
          </h2>
          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--color-tan)] text-[var(--color-brown-dark)] focus:ring-[var(--color-brown)]"
              />
              <span className="text-[var(--color-brown-dark)]">
                Email me when friends add 5-star ratings
              </span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={notifySms}
                onChange={(e) => setNotifySms(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--color-tan)] text-[var(--color-brown-dark)] focus:ring-[var(--color-brown)]"
              />
              <span className="text-[var(--color-brown-dark)]">
                SMS notifications (requires phone number)
              </span>
            </label>

            {notifySms && (
              <Input
                label="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1234567890"
                type="tel"
              />
            )}
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center gap-4 pt-4 border-t border-[var(--color-tan)]">
          <Button onClick={handleSave} loading={saving}>
            Save Changes
          </Button>
          {message && (
            <p
              className={`text-sm ${message.includes('success') ? 'text-[var(--color-green)]' : 'text-[var(--color-red)]'}`}
            >
              {message}
            </p>
          )}
        </div>
      </div>

      {/* Danger zone */}
      <div className="card p-6 mt-6 border-[var(--color-red)]">
        <h2 className="text-lg font-serif font-bold text-[var(--color-red)] mb-4">Danger Zone</h2>
        <p className="text-sm text-[var(--color-brown)] mb-4">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <Button variant="secondary" className="border-[var(--color-red)] text-[var(--color-red)]">
          Delete Account
        </Button>
      </div>
    </div>
  );
}
