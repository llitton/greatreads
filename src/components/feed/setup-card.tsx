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
    <div className="bg-white rounded-2xl border border-black/5 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-serif font-bold text-[#1f1a17]">
          Get Started
        </h3>
        <span className="text-xs font-medium text-[#8b7355] bg-[#fbf7ef] px-3 py-1 rounded-full">
          {progress}/2
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-neutral-100 rounded-full mb-5 overflow-hidden">
        <div
          className="h-full bg-[#4a7c59] rounded-full transition-all duration-500"
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
                ? 'bg-[#4a7c59] text-white'
                : 'bg-neutral-100 text-neutral-500'
            }`}
          >
            {step1Complete ? '✓' : '1'}
          </div>
          <div className="flex-1">
            <p
              className={`text-sm font-medium ${
                step1Complete ? 'text-[#4a7c59]' : 'text-[#1f1a17]'
              }`}
            >
              Add a friend
            </p>
            {!step1Complete && (
              <button
                onClick={onAddFriend}
                className="mt-1 text-sm text-neutral-500 hover:text-[#1f1a17] transition-colors"
              >
                Connect their Goodreads →
              </button>
            )}
            {step1Complete && (
              <p className="mt-0.5 text-xs text-neutral-400">
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
                ? 'bg-[#4a7c59] text-white'
                : 'bg-neutral-100 text-neutral-500'
            }`}
          >
            {step2Complete ? '✓' : '2'}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p
                className={`text-sm font-medium ${
                  step2Complete ? 'text-[#4a7c59]' : 'text-[#1f1a17]'
                }`}
              >
                Turn on notifications
              </p>
              <button
                onClick={handleToggle}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  notifications ? 'bg-[#4a7c59]' : 'bg-neutral-200'
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
            <p className="mt-0.5 text-xs text-neutral-400">
              Get emailed about new 5-stars
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
