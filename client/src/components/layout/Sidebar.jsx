import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import Logo from './Logo';
import { NAV_GROUPS } from '../../config/nav';

function NavItem({ item, onNavigate }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      className={({ isActive }) =>
        `group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isActive ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={18} aria-hidden="true" className={isActive ? 'text-signal' : ''} />
          {item.label}
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {/* Mobile overlay */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-30 bg-navy-950/60 transition-opacity lg:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      <aside
        aria-label="Primary"
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-navy-900 dark:border-r dark:border-line transition-transform duration-200 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Logo />
          <button onClick={onClose} aria-label="Close menu" className="rounded-md p-1 text-white/70 hover:text-white lg:hidden">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-3 pb-1.5 text-xs font-semibold text-white/40">{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavItem key={item.to} item={item} onNavigate={onClose} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="m-3 rounded-lg bg-navy-800 p-3.5">
          <p className="text-sm font-semibold text-white">Placement season</p>
          <p className="mt-0.5 text-xs leading-relaxed text-white/60">
            Short, regular sessions beat long cramming. Aim for one interview a day.
          </p>
        </div>
      </aside>
    </>
  );
}
