'use client';

import { useState } from 'react';

interface SetupCardProps {
  friendsCount: number;
  notificationsEnabled?: boolean;
  onAddFriend: () => void;
  onToggleNotifications?: (enabled: boolean) => void;
}

export function SetupCard({
  friendsCount,
  notificationsEnabled = false,
  onAddFriend,
  onToggleNotifications,
}: SetupCardProps) {
  const [notifications, setNotifications] = useState(notificationsEnabled);

  const handleToggle = () => {
    const newValue = !notifications;
    setNotifications(newValue);
    onToggleNotifications?.(newValue);
  };

  const step1Complete = friendsCount > 0;
  const step2Complete = notifications;
  const progress = (step1Complete ? 1 : 0) + (step2Complete ? 1 : 0);

  return (
    <div className="bg-white rounded-xl border border-[var(--color-tan)] p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif font-bold text-[var(--color-brown-dark)]">
          Get Started
        </h3>
        <span className="text-xs font-medium text-[var(--color-brown-light)] bg-[var(--color-parchment)] px-2 py-1 rounded-full">
          {progress}/2
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-[var(--color-parchment)] rounded-full mb-5 overflow-hidden">
        <div
          className="h-full bg-[var(--color-green)] rounded-full transition-all duration-500"
          style={{ width: `${(progress / 2) * 100}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {/* Step 1: Add a friend */}
        <div className="flex items-start gap-3">
          <div
            className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
              step1Complete
                ? 'bg-[var(--color-green)] text-white'
                : 'bg-[var(--color-parchment)] text-[var(--color-brown)]'
            }`}
          >
            {step1Complete ? '✓' : '1'}
          </div>
          <div className="flex-1">
            <p
              className={`text-sm font-medium ${
                step1Complete ? 'text-[var(--color-green)]' : 'text-[var(--color-brown-dark)]'
              }`}
            >
              Add someone whose taste you trust
            </p>
            {!step1Complete && (
              <button
                onClick={onAddFriend}
                className="mt-2 text-sm text-[var(--color-brown-dark)] underline underline-offset-2 hover:no-underline"
              >
                Add friend&apos;s Goodreads feed
              </button>
            )}
            {step1Complete && (
              <p className="mt-1 text-xs text-[var(--color-brown-light)]">
                Following {friendsCount} {friendsCount === 1 ? 'friend' : 'friends'}
              </p>
            )}
          </div>
        </div>

        {/* Step 2: Notifications */}
        <div className="flex items-start gap-3">
          <div
            className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
              step2Complete
                ? 'bg-[var(--color-green)] text-white'
                : 'bg-[var(--color-parchment)] text-[var(--color-brown)]'
            }`}
          >
            {step2Complete ? '✓' : '2'}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p
                className={`text-sm font-medium ${
                  step2Complete ? 'text-[var(--color-green)]' : 'text-[var(--color-brown-dark)]'
                }`}
              >
                Get notified about new picks
              </p>
              <button
                onClick={handleToggle}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  notifications ? 'bg-[var(--color-green)]' : 'bg-[var(--color-tan)]'
                }`}
                role="switch"
                aria-checked={notifications}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                    notifications ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
            <p className="mt-1 text-xs text-[var(--color-brown-light)]">
              Email me when there&apos;s a new 5-star
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
