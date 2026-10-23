"use client";

import { useState } from "react";
import { Icon } from "./ui";

const notifications = [
  { id: 1, text: "Rahul Sharma updated Review mobile navigation.", time: "Today" },
  { id: 2, text: "Priya Mehta was added to Website redesign.", time: "Yesterday" },
];

export function NotificationButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [read, setRead] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Notifications"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        onClick={() => setIsOpen((open) => !open)}
        className="relative rounded-lg p-2 text-[#757e90] hover:bg-[#f3f4f8]"
      >
        <Icon name="bell" size={19} />
        {!read && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-white bg-[#ef7770]" />}
      </button>
      {isOpen && (
        <section
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-full z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-[#eaecf1] bg-white p-4 shadow-xl"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-[#303748]">Notifications</h2>
            <button
              type="button"
              onClick={() => setRead(true)}
              className="text-xs font-medium text-[#6558d3] hover:underline"
            >
              Mark all as read
            </button>
          </div>
          <ul className="divide-y divide-[#f0f1f4]">
            {notifications.map((notification) => (
              <li key={notification.id} className="py-3 first:pt-0 last:pb-0">
                <p className="text-xs leading-5 text-[#50596b]">{notification.text}</p>
                <p className="mt-1 text-[11px] text-[#9aa1b1]">{notification.time}</p>
              </li>
            ))}
          </ul>
          <p className="mt-3 border-t border-[#f0f1f4] pt-3 text-[11px] text-[#9aa1b1]">
            Demo notifications
          </p>
        </section>
      )}
    </div>
  );
}
