import { useCallback, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, Menu, Settings, User, LogOut } from 'lucide-react';
import useSession, { initials } from '../../hooks/useSession';
import useClickOutside from '../../lib/useClickOutside';
import ThemeToggle from '../ui/ThemeToggle';

function Dropdown({ button, children, align = 'right', label }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={label}
        className="flex items-center rounded-lg p-1.5 hover:bg-surface"
      >
        {button}
      </button>
      {open && (
        <div
          className={`absolute top-full z-30 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl bg-surface shadow-pop ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
          onClick={close}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export default function Topbar({ onMenu }) {
  const { user, notifications, logout } = useSession();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-line bg-paper/90 px-4 backdrop-blur sm:px-6 lg:px-8">
      <button onClick={onMenu} aria-label="Open menu" className="rounded-lg p-2 text-ink hover:bg-surface lg:hidden">
        <Menu size={22} />
      </button>
      <p className="hidden text-sm text-ink-soft lg:block">
        Target role: <span className="font-semibold text-ink">{user.targetRole}</span>
      </p>

      <div className="flex items-center gap-2">
        <ThemeToggle showLabel />
        <Dropdown
          label={`Notifications, ${notifications.length} new`}
          button={
            <span className="relative text-ink-soft">
              <Bell size={20} />
              {notifications.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-signal ring-2 ring-paper" />
              )}
            </span>
          }
        >
          <p className="border-b border-line px-4 py-3 font-display text-sm font-semibold">Notifications</p>
          {notifications.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-ink-soft">You're all caught up.</p>
          ) : (
            <ul className="max-h-72 divide-y divide-line overflow-y-auto">
              {notifications.map((n) => (
                <li key={n.id} className="px-4 py-3">
                  <p className="text-sm">{n.text}</p>
                  <p className="mt-0.5 text-xs text-ink-faint">{n.time}</p>
                </li>
              ))}
            </ul>
          )}
        </Dropdown>

        <Dropdown
          label="Account menu"
          button={
            <span className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-navy-900 text-xs font-semibold text-white">
                {initials(user.name)}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-sm font-semibold leading-tight">{user.name}</span>
                <span className="block text-xs leading-tight text-ink-soft">{user.title}</span>
              </span>
              <ChevronDown size={16} className="hidden text-ink-faint sm:block" aria-hidden="true" />
            </span>
          }
        >
          <div className="p-1.5">
            <Link to="/profile" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-paper">
              <User size={16} aria-hidden="true" /> Profile
            </Link>
            <Link to="/settings" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-paper">
              <Settings size={16} aria-hidden="true" /> Settings
            </Link>
            <div className="my-1 border-t border-line" />
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-rose hover:bg-rose-soft/40 transition-colors"
            >
              <LogOut size={16} aria-hidden="true" /> Sign out
            </button>
          </div>
        </Dropdown>
      </div>
    </header>
  );
}
