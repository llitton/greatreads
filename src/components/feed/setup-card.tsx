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
    <div className="bg-white rounded-xl border border-[#e8e0d4] p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-serif font-bold text-[#1f1a17]">
          Get Started
        </h3>
        <span className="text-xs font-medium text-[#8b7355] bg-[#fbf7ef] px-3 py-1 rounded-full">
          {progress}/2
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-[#f5f0e6] rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-[#4a7c59] rounded-full transition-all duration-500"
          style={{ width: `${(progress / 2) * 100}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-5">
        {/* Step 1: Add a friend */}
        <div className="flex items-start gap-4">
          <div
            className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
              step1Complete
                ? 'bg-[#4a7c59] text-white'
                : 'bg-[#f5f0e6] text-[#5b4a3f]'
            }`}
          >
            {step1Complete ? '✓' : '1'}
          </div>
          <div className="flex-1 pt-0.5">
            <p
              className={`text-[15px] font-medium ${
                step1Complete ? 'text-[#4a7c59]' : 'text-[#1f1a17]'
              }`}
            >
              Add someone whose taste you trust
            </p>
            {!step1Complete && (
              <button
                onClick={onAddFriend}
                className="mt-2 text-sm text-[#5b4a3f] underline underline-offset-2 hover:text-[#1f1a17] transition-colors"
              >
                Add friend&apos;s Goodreads feed
              </button>
            )}
            {step1Complete && (
              <p className="mt-1 text-sm text-[#8b7355]">
                Following {friendsCount} {friendsCount === 1 ? 'friend' : 'friends'}
              </p>
            )}
          </div>
        </div>

        {/* Step 2: Notifications */}
        <div className="flex items-start gap-4">
          <div
            className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
              step2Complete
                ? 'bg-[#4a7c59] text-white'
                : 'bg-[#f5f0e6] text-[#5b4a3f]'
            }`}
          >
            {step2Complete ? '✓' : '2'}
          </div>
          <div className="flex-1 pt-0.5">
            <div className="flex items-center justify-between">
              <p
                className={`text-[15px] font-medium ${
                  step2Complete ? 'text-[#4a7c59]' : 'text-[#1f1a17]'
                }`}
              >
                Get notified about new picks
              </p>
              <button
                onClick={handleToggle}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  notifications ? 'bg-[#4a7c59]' : 'bg-[#e8e0d4]'
                }`}
                role="switch"
                aria-checked={notifications}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    notifications ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
            <p className="mt-1 text-sm text-[#8b7355]">
              Email me when there&apos;s a new 5-star
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
