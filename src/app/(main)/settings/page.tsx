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

// Toggle switch component - modern, accessible
function Toggle({
  checked,
  onChange,
  id,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-7 rounded-full transition-colors duration-200 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4a7c59]/50 ${
        checked ? 'bg-[#4a7c59]' : 'bg-neutral-300'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

// Clickable toggle row - whole row toggles the switch
function ToggleRow({
  label,
  description,
  checked,
  onChange,
  id,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  id: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="w-full flex items-start justify-between gap-6 p-4 -mx-4 rounded-xl hover:bg-neutral-50 transition-colors text-left cursor-pointer"
    >
      <div className="flex-1 min-w-0">
        <label htmlFor={id} className="text-[15px] font-medium text-[#1f1a17] cursor-pointer">
          {label}
        </label>
        <p className="text-sm text-neutral-500 leading-relaxed mt-0.5">
          {description}
        </p>
      </div>
      <div className="flex-shrink-0 pt-0.5">
        <Toggle checked={checked} onChange={onChange} id={id} />
      </div>
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
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Page header - philosophy framing */}
      <header className="mb-12">
        <h1 className="text-2xl font-semibold text-[#1f1a17] mb-2">
          Settings
        </h1>
        <p className="text-[17px] text-neutral-500 leading-relaxed mb-2">
          Manage how GreatReads works for you.
        </p>
        <p className="text-sm text-neutral-400 italic">
          Designed to be quiet, respectful, and intentional.
        </p>
      </header>

      <div className="space-y-8">
        {/* Identity card - separates account from authorship */}
        <section className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
          <div className="p-6 pb-0">
            <h2 className="text-lg font-semibold text-[#1f1a17] mb-1">
              Identity
            </h2>
            <p className="text-sm text-neutral-500 leading-relaxed">
              One person reads. Another person&apos;s taste shapes the recommendations.
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* Account holder */}
            <div>
              <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-2">
                Who uses this app
              </p>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Mark"
                className="w-full h-11 px-4 text-[15px] bg-neutral-50 border border-black/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1f1a17]/10 focus:border-transparent transition-all"
              />
              <p className="text-xs text-neutral-400 mt-2">
                The person browsing and discovering.
              </p>
            </div>

            {/* Recommendation credit - shows source of taste */}
            <div className="pt-4 border-t border-black/5">
              <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-2">
                Whose taste shapes recommendations
              </p>
              <div className="flex items-center gap-3 h-11 px-4 bg-amber-50/50 rounded-xl border border-amber-100">
                <span className="text-[15px] font-medium text-[#1f1a17]">
                  Laura
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-2">
                Appears as: <span className="text-amber-600 font-medium">&ldquo;Loved by Laura&rdquo;</span>
              </p>
            </div>

            {/* Email - de-emphasized */}
            <div className="pt-4 border-t border-black/5">
              <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-2">
                Sign-in email
              </p>
              <div className="flex items-center gap-3 h-11 px-4 bg-neutral-50 rounded-xl border border-black/5">
                <span className="text-[15px] text-neutral-600">
                  {settings?.email}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Reading history - shows import source as provenance */}
        <section className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
          <div className="p-6 pb-0">
            <h2 className="text-lg font-semibold text-[#1f1a17] mb-1">
              Source of truth
            </h2>
            <p className="text-sm text-neutral-500 leading-relaxed">
              Where recommendations come from.
            </p>
          </div>

          <div className="p-6">
            <div className="flex items-start justify-between gap-6 p-4 bg-[#faf8f5] rounded-xl border border-[#f0ebe3]">
              <div className="flex-1">
                <p className="text-[15px] font-medium text-[#1f1a17] mb-1">
                  Goodreads library
                </p>
                <p className="text-sm text-neutral-500 leading-relaxed">
                  Laura&apos;s reading history, imported via CSV.
                </p>
                <p className="text-xs text-neutral-400 mt-2 italic">
                  No ratings were changed. Only 5-stars appear.
                </p>
              </div>
              <a
                href="/import"
                className="text-sm text-neutral-400 hover:text-[#1f1a17] transition-colors flex-shrink-0"
              >
                Re-import →
              </a>
            </div>
          </div>
        </section>

        {/* Signals you want to receive */}
        <section className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
          <div className="p-6 pb-0">
            <h2 className="text-lg font-semibold text-[#1f1a17] mb-1">
              Signals you want to receive
            </h2>
            <p className="text-sm text-neutral-500 leading-relaxed">
              Rare by design. Only strong signals.
            </p>
          </div>

          <div className="p-6 space-y-2">
            {/* Email notifications - clickable row */}
            <ToggleRow
              id="notify-email"
              label="Notify me when someone I trust gives a book five stars"
              description="Only when someone you follow really loved something."
              checked={notifyEmail}
              onChange={setNotifyEmail}
            />

            {/* Divider */}
            <div className="border-t border-black/5 mx-4" />

            {/* SMS notifications - clickable row */}
            <ToggleRow
              id="notify-sms"
              label="Text me about exceptional picks"
              description="Fewer than a handful per year. Reserved for books that truly stand out."
              checked={notifySms}
              onChange={setNotifySms}
            />

            {/* Phone number input - shown when SMS is enabled */}
            {notifySms && (
              <div className="pt-4 pl-4 pr-4 animate-fadeIn">
                <label className="block text-sm font-medium text-[#1f1a17] mb-2">
                  Phone number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="w-full h-11 px-4 text-[15px] bg-neutral-50 border border-black/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1f1a17]/10 focus:border-transparent transition-all"
                />
                <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                  Standard messaging rates may apply.
                </p>
              </div>
            )}
          </div>

          {/* Card footer with save */}
          <div className="px-6 py-4 bg-neutral-50 border-t border-black/5 flex items-center justify-end gap-4">
            {saved && (
              <span className="text-sm text-emerald-600 animate-fadeIn flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Saved
              </span>
            )}
            {error && (
              <span className="text-sm text-red-600">
                {error}
              </span>
            )}
            <Button onClick={handleSave} loading={saving}>
              Save Changes
            </Button>
          </div>
        </section>

        {/* Principles - manifesto, not footer */}
        <section className="bg-neutral-50 rounded-2xl p-8">
          <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wide mb-6">
            Principles
          </h2>
          <div className="space-y-3 text-[15px] text-neutral-600 leading-relaxed">
            <p>No ads</p>
            <p>No tracking</p>
            <p>No engagement tricks</p>
            <p className="pt-2 text-neutral-500">Your data is yours.</p>
          </div>
        </section>

        {/* Danger Zone card */}
        <section className="bg-white rounded-2xl border border-red-100 overflow-hidden">
          <div className="p-6 pb-0">
            <h2 className="text-lg font-semibold text-red-600 mb-1">
              Danger Zone
            </h2>
            <p className="text-sm text-neutral-500 leading-relaxed">
              We don&apos;t believe in trapping people here.
            </p>
          </div>

          <div className="p-6">
            <div className="flex items-start justify-between gap-6 p-4 bg-red-50/50 rounded-xl">
              <div className="flex-1">
                <p className="text-[15px] font-medium text-[#1f1a17] mb-0.5">
                  Delete account
                </p>
                <p className="text-sm text-neutral-500 leading-relaxed">
                  Permanently delete your account and all your reading data. This cannot be undone.
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="flex-shrink-0 border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300"
              >
                Delete
              </Button>
            </div>
          </div>
        </section>
      </div>

      {/* Quiet footer note */}
      <footer className="mt-16 mb-4 text-center space-y-3">
        <p className="text-sm text-neutral-400">
          You can change any of this later.
        </p>
        <p className="text-sm text-neutral-300 italic">
          GreatReads is built to stay out of the way.
        </p>
      </footer>
    </div>
  );
}
