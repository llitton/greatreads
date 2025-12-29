'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { TrustedSourcesSummary } from '@/components/settings/trusted-sources-summary';

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

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifySms, setNotifySms] = useState(false);

  // Editing state
  const [editingName, setEditingName] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);

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

  // Auto-save on changes
  const saveSettings = useCallback(async (updates: Partial<{
    name: string;
    phone: string | null;
    notifyEmail: boolean;
    notifySms: boolean;
  }>) => {
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
        fetchSettings();
      }
    } catch {
      setSaveStatus('idle');
    }
  }, []);

  const handleNameSave = () => {
    setEditingName(false);
    saveSettings({ name: name || undefined });
  };

  const handlePhoneSave = () => {
    setEditingPhone(false);
    saveSettings({ phone: phone || null });
  };

  const handleToggleEmail = (checked: boolean) => {
    setNotifyEmail(checked);
    saveSettings({ notifyEmail: checked });
  };

  const handleToggleSms = (checked: boolean) => {
    setNotifySms(checked);
    saveSettings({ notifySms: checked });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-4xl mb-4 opacity-50">◌</div>
          <p className="text-neutral-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-5 py-8">
      {/* Header */}
      <header className="mb-16">
        <h1 className="text-2xl font-serif text-[#1f1a17] mb-3">
          Settings
        </h1>
        <p className="text-[15px] text-neutral-500 leading-relaxed">
          How GreatReads works for you.
        </p>
      </header>

      {/* Save indicator - subtle, inline */}
      {saveStatus !== 'idle' && (
        <div className="fixed top-5 right-5 z-50">
          <span className={`text-xs px-3 py-2 rounded-full ${
            saveStatus === 'saving'
              ? 'bg-neutral-100 text-neutral-500'
              : 'bg-emerald-50 text-emerald-600'
          }`}>
            {saveStatus === 'saving' ? 'Saving...' : 'Saved'}
          </span>
        </div>
      )}

      <div className="space-y-16">
        {/* ═══════════════════════════════════════════════════════════════════
            PERSPECTIVE - Who's browsing and who they trust
        ═══════════════════════════════════════════════════════════════════ */}
        <section>
          <h2 className="text-xs text-neutral-300 uppercase tracking-widest mb-8">
            Perspective
          </h2>

          <div className="space-y-8">
            {/* Browsing as */}
            <div>
              <p className="text-xs text-neutral-400 mb-2">Browsing as</p>
              {!editingName ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-medium text-[#1f1a17]">
                      {name || 'Mark'}
                    </p>
                    <p className="text-sm text-neutral-400">
                      The person discovering and curating.
                    </p>
                  </div>
                  <button
                    onClick={() => setEditingName(true)}
                    className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Name"
                    autoFocus
                    className="w-full h-11 px-3 text-[15px] bg-neutral-50 border border-black/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1f1a17]/10"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleNameSave}
                      className="px-3 py-2 text-sm font-medium text-white bg-[#1f1a17] rounded-lg hover:bg-[#2f2a27] transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingName(false);
                        setName(settings?.name || '');
                      }}
                      className="px-3 py-2 text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Separator */}
            <div className="h-px bg-neutral-100" />

            {/* Trusted sources */}
            <div>
              <p className="text-xs text-neutral-400 mb-2">Recommendations come from</p>
              <TrustedSourcesSummary
                showExpanded={true}
                onManage={() => router.push('/feed')}
              />
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            SIGNALS - Commitments, not toggles
        ═══════════════════════════════════════════════════════════════════ */}
        <section>
          <h2 className="text-xs text-neutral-300 uppercase tracking-widest mb-8">
            How you want to be interrupted
          </h2>

          <p className="text-sm text-neutral-500 mb-5">
            When someone you trust rates a book 5 stars, you&apos;ll see it in {name || 'Mark'}&apos;s feed.
          </p>

          <div className="space-y-5">
            {/* Five-star notifications */}
            <div className="p-5 bg-[#fdfcfa] rounded-2xl border border-[#f0ebe3]">
              <div className="flex items-start justify-between gap-5">
                <div className="flex-1">
                  <p className="text-[15px] font-medium text-[#1f1a17] mb-1">
                    Five-star notifications
                  </p>
                  <p className="text-sm text-neutral-500 leading-relaxed">
                    Get notified when your trusted sources truly love something.
                  </p>
                </div>
                <Toggle
                  checked={notifyEmail}
                  onChange={handleToggleEmail}
                  id="notify-email"
                />
              </div>
            </div>

            {/* Exceptional picks */}
            <div className="p-5 bg-[#fdfcfa] rounded-2xl border border-[#f0ebe3]">
              <div className="flex items-start justify-between gap-5">
                <div className="flex-1">
                  <p className="text-[15px] font-medium text-[#1f1a17] mb-1">
                    Exceptional picks (SMS)
                  </p>
                  <p className="text-sm text-neutral-500 leading-relaxed">
                    Interrupt me rarely. Only when it really matters.
                  </p>
                  <p className="text-xs text-neutral-400 mt-2">
                    Most people receive 2–4 of these per year.
                  </p>
                </div>
                <Toggle
                  checked={notifySms}
                  onChange={handleToggleSms}
                  id="notify-sms"
                />
              </div>

              {/* Phone number - shown when SMS enabled */}
              {notifySms && (
                <div className="mt-5 pt-5 border-t border-[#f0ebe3]">
                  {!editingPhone ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-neutral-400 mb-1">Phone</p>
                        <p className="text-sm text-[#1f1a17]">
                          {phone || 'Not set'}
                        </p>
                      </div>
                      <button
                        onClick={() => setEditingPhone(true)}
                        className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
                      >
                        {phone ? 'Change' : 'Add'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        autoFocus
                        className="w-full h-11 px-3 text-[15px] bg-white border border-black/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1f1a17]/10"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handlePhoneSave}
                          className="px-3 py-2 text-sm font-medium text-white bg-[#1f1a17] rounded-lg hover:bg-[#2f2a27] transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingPhone(false);
                            setPhone(settings?.phone || '');
                          }}
                          className="px-3 py-2 text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            WHAT GREATREADS PROMISES - A pact, not a footer
        ═══════════════════════════════════════════════════════════════════ */}
        <section className="py-8 border-y border-neutral-100">
          <h2 className="text-xs text-neutral-300 uppercase tracking-widest mb-8">
            What GreatReads promises
          </h2>

          <div className="space-y-3">
            <p className="text-[15px] text-neutral-600">No ads</p>
            <p className="text-[15px] text-neutral-600">No tracking</p>
            <p className="text-[15px] text-neutral-600">No engagement tricks</p>
            <p className="text-[15px] text-neutral-600">Your data is yours</p>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            DANGER ZONE - Clear exit
        ═══════════════════════════════════════════════════════════════════ */}
        <section>
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="text-[15px] font-medium text-[#1f1a17] mb-1">
                Delete account
              </p>
              <p className="text-sm text-neutral-500 leading-relaxed">
                Permanently delete your account and all data.
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="flex-shrink-0 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
            >
              Delete
            </Button>
          </div>
        </section>
      </div>

      {/* Footer - quiet finality */}
      <footer className="mt-8 pt-8 border-t border-neutral-50 text-center">
        <p className="text-sm text-neutral-300 italic leading-relaxed">
          Nothing here is optimized for engagement.
          <br />
          Only for trust.
        </p>
      </footer>
    </div>
  );
}
