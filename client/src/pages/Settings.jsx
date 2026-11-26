import { useEffect, useState } from 'react';
import {
  Lock, Mic, Video, Volume2, ShieldAlert,
  CheckCircle, Save, Eye, EyeOff, Trash2, RotateCcw, AlertTriangle, Pencil, Undo2, AlertCircle,
} from 'lucide-react';
import { getSettings, saveSettings, saveInterviews } from '../data/mock';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import Panel from '../components/ui/Panel';

export default function Settings() {
  const { logout } = useAuth();
  const [settings, setSettings] = useState(getSettings());
  const [backupSettings, setBackupSettings] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedToast, setSavedToast] = useState('');
  const [saveError, setSaveError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionNotice, setActionNotice] = useState('');

  useEffect(() => {
    let active = true;
    async function loadSettings() {
      try {
        const remote = await api.get('/settings');
        if (active && remote) {
          const merged = { ...getSettings(), ...remote };
          setSettings(merged);
          saveSettings(merged);
        }
      } catch (err) {
        console.info('Settings DB sync notice:', err.message);
      }
    }
    loadSettings();
    return () => {
      active = false;
    };
  }, []);

  const handleStartEdit = () => {
    setBackupSettings(JSON.parse(JSON.stringify(settings)));
    setSaveError('');
    setSavedToast('');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (backupSettings) {
      setSettings(backupSettings);
    }
    setIsEditing(false);
    setSaveError('');
    setPasswordError('');
    setPasswordSuccess(false);
    setPasswords({ current: '', next: '', confirm: '' });
  };

  const handleToggle = (key) => {
    if (!isEditing) return;
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleChange = (key, val) => {
    if (!isEditing) return;
    setSettings((prev) => ({ ...prev, [key]: val }));
  };

  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSaveError('');
    setSavedToast('');

    try {
      const response = await api.put('/settings', settings);
      const saved = { ...settings, ...(response?.settings || {}) };
      setSettings(saved);
      saveSettings(saved);
      setIsEditing(false);
      setSavedToast('Preferences saved to database!');
      setTimeout(() => setSavedToast(''), 3000);
    } catch (err) {
      if (err.status && err.status >= 400 && err.status < 500) {
        setSaveError(err.message || 'Unable to save settings.');
      } else {
        saveSettings(settings);
        setIsEditing(false);
        setSaveError(
          `Saved locally, but the database server could not be reached (${err.message}).`,
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!isEditing) return;
    setPasswordError('');
    setPasswordSuccess(false);

    if (!passwords.current) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (passwords.next.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (passwords.next !== passwords.confirm) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    try {
      await api.post('/settings/change-password', {
        current: passwords.current,
        next: passwords.next,
      });
      setPasswordSuccess(true);
      setPasswords({ current: '', next: '', confirm: '' });
      setTimeout(() => setPasswordSuccess(false), 4000);
    } catch (err) {
      setPasswordError(err.message || 'Failed to update password.');
    }
  };

  const handleResetHistory = async () => {
    if (!isEditing) {
      alert("Please click 'Edit Settings' first to perform data management actions.");
      return;
    }
    if (window.confirm('Are you sure you want to clear your interview records?')) {
      try {
        await api.post('/settings/reset-history');
      } catch (err) {
        console.info('Reset history DB notice:', err.message);
      }
      saveInterviews([]);
      setActionNotice('Interview history cleared from database.');
      setTimeout(() => setActionNotice(''), 3500);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await api.delete('/profile');
    } catch (err) {
      console.info('Delete account DB notice:', err.message);
    }
    localStorage.clear();
    logout();
    setShowDeleteModal(false);
    setActionNotice('Account data cleared. Redirecting to login...');
    setTimeout(() => {
      window.location.href = '/login';
    }, 1000);
  };

  const selectClass = `mt-1.5 w-full rounded-lg border text-sm transition-all ${
    isEditing
      ? 'border-line bg-paper px-3 py-2 text-ink focus:bg-surface focus:outline-none focus:ring-2 focus:ring-signal'
      : 'border-line/60 bg-paper/50 px-3 py-2 text-ink/80 cursor-default focus:outline-none'
  }`;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Account & System Settings
            </h1>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                isEditing
                  ? 'bg-signal-soft text-signal-deep border border-signal/20 animate-pulse'
                  : 'bg-paper text-ink-faint border border-line'
              }`}
            >
              {isEditing ? 'Editing Mode' : 'View Only'}
            </span>
          </div>
          <p className="mt-1 text-sm text-ink-soft">
            Manage your credentials, audio/video devices, notifications, and privacy options.
          </p>
        </div>

        {/* Action Buttons: Edit vs Save Changes */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {!isEditing ? (
            <button
              onClick={handleStartEdit}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Pencil size={15} /> Edit Settings
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={saving}
                className="btn-outline inline-flex items-center gap-1.5 text-xs"
              >
                <Undo2 size={15} /> Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={saving}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Save size={15} /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          )}
        </div>
      </div>

      {savedToast && (
        <div className="flex items-center gap-2.5 rounded-xl border border-jade/30 bg-jade-soft px-4 py-3 text-sm font-semibold text-jade">
          <CheckCircle size={18} /> {savedToast}
        </div>
      )}

      {saveError && (
        <div className="flex items-center gap-2.5 rounded-xl border border-rose/30 bg-rose-soft px-4 py-3 text-sm font-semibold text-rose">
          <AlertCircle size={18} className="shrink-0" /> {saveError}
        </div>
      )}

      {actionNotice && (
        <div className="flex items-center gap-2.5 rounded-xl border border-signal/30 bg-signal-soft px-4 py-3 text-sm font-semibold text-signal-deep">
          <CheckCircle size={18} /> {actionNotice}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Security & Password */}
          <Panel title="Security & Authentication">
            <form onSubmit={handleChangePassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-ink-soft">Current Password</label>
                <div className="relative mt-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    disabled={!isEditing}
                    placeholder={isEditing ? 'Enter current password' : '••••••••••••'}
                    value={passwords.current}
                    onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
                    className={`w-full rounded-lg border pr-10 text-sm transition-all ${
                      isEditing
                        ? 'border-line bg-paper px-3 py-2 text-ink focus:bg-surface focus:outline-none focus:ring-2 focus:ring-signal'
                        : 'border-line/60 bg-paper/50 px-3 py-2 text-ink/80 cursor-default'
                    }`}
                  />
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-ink-faint hover:text-ink"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  )}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-ink-soft">New Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    disabled={!isEditing}
                    placeholder={isEditing ? 'At least 6 chars' : '••••••••••••'}
                    value={passwords.next}
                    onChange={(e) => setPasswords((p) => ({ ...p, next: e.target.value }))}
                    className={`mt-1 w-full rounded-lg border text-sm transition-all ${
                      isEditing
                        ? 'border-line bg-paper px-3 py-2 text-ink focus:bg-surface focus:outline-none focus:ring-2 focus:ring-signal'
                        : 'border-line/60 bg-paper/50 px-3 py-2 text-ink/80 cursor-default'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-soft">Confirm New Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    disabled={!isEditing}
                    placeholder={isEditing ? 'Repeat password' : '••••••••••••'}
                    value={passwords.confirm}
                    onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
                    className={`mt-1 w-full rounded-lg border text-sm transition-all ${
                      isEditing
                        ? 'border-line bg-paper px-3 py-2 text-ink focus:bg-surface focus:outline-none focus:ring-2 focus:ring-signal'
                        : 'border-line/60 bg-paper/50 px-3 py-2 text-ink/80 cursor-default'
                    }`}
                  />
                </div>
              </div>

              {passwordError && (
                <p className="text-xs font-semibold text-rose">{passwordError}</p>
              )}
              {passwordSuccess && (
                <p className="text-xs font-semibold text-jade">Password changed successfully.</p>
              )}

              <div className="pt-1">
                {isEditing ? (
                  <button type="submit" className="btn-outline text-xs">
                    <Lock size={14} /> Update Password
                  </button>
                ) : (
                  <p className="text-[11px] text-ink-faint">
                    Click "Edit Settings" above to change your password.
                  </p>
                )}
              </div>
            </form>
          </Panel>

          {/* Notifications */}
          <Panel title="Notifications & Reminders">
            <div className="space-y-4">
              <label className={`flex items-start justify-between gap-4 ${isEditing ? 'cursor-pointer' : 'cursor-default'}`}>
                <div>
                  <p className="text-sm font-semibold text-ink">Email Notifications</p>
                  <p className="text-xs text-ink-soft">Receive interview performance feedback and study tips</p>
                </div>
                <input
                  type="checkbox"
                  disabled={!isEditing}
                  checked={settings.emailNotifications}
                  onChange={() => handleToggle('emailNotifications')}
                  className={`h-4 w-4 rounded border-line text-signal focus:ring-signal ${!isEditing ? 'opacity-60 cursor-default' : ''}`}
                />
              </label>

              <label className={`flex items-start justify-between gap-4 border-t border-line pt-3 ${isEditing ? 'cursor-pointer' : 'cursor-default'}`}>
                <div>
                  <p className="text-sm font-semibold text-ink">Daily Practice Reminder</p>
                  <p className="text-xs text-ink-soft">Remind you to maintain your practice streak at 8:00 PM</p>
                </div>
                <input
                  type="checkbox"
                  disabled={!isEditing}
                  checked={settings.dailyPracticeReminder}
                  onChange={() => handleToggle('dailyPracticeReminder')}
                  className={`h-4 w-4 rounded border-line text-signal focus:ring-signal ${!isEditing ? 'opacity-60 cursor-default' : ''}`}
                />
              </label>

              <label className={`flex items-start justify-between gap-4 border-t border-line pt-3 ${isEditing ? 'cursor-pointer' : 'cursor-default'}`}>
                <div>
                  <p className="text-sm font-semibold text-ink">Weekly Performance Digest</p>
                  <p className="text-xs text-ink-soft">Summary of weakest subjects and placement readiness improvements</p>
                </div>
                <input
                  type="checkbox"
                  disabled={!isEditing}
                  checked={settings.weeklyReportDigest}
                  onChange={() => handleToggle('weeklyReportDigest')}
                  className={`h-4 w-4 rounded border-line text-signal focus:ring-signal ${!isEditing ? 'opacity-60 cursor-default' : ''}`}
                />
              </label>
            </div>
          </Panel>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Interview Hardware & Audio */}
          <Panel title="Audio & Interview Room Setup">
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
                  <Mic size={14} /> Preferred Microphone
                </label>
                <select
                  disabled={!isEditing}
                  value={settings.micDevice}
                  onChange={(e) => handleChange('micDevice', e.target.value)}
                  className={selectClass}
                >
                  <option>Built-in Audio Microphone (Default)</option>
                  <option>External USB Headset Microphone</option>
                  <option>AirPods / Bluetooth Hands-Free</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
                  <Video size={14} /> Preferred Camera
                </label>
                <select
                  disabled={!isEditing}
                  value={settings.cameraDevice}
                  onChange={(e) => handleChange('cameraDevice', e.target.value)}
                  className={selectClass}
                >
                  <option>Integrated HD Webcam (1280x720)</option>
                  <option>Logitech C920 Pro HD Webcam</option>
                  <option>Virtual Camera (OBS)</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
                  <Volume2 size={14} /> AI Interviewer Voice (TTS)
                </label>
                <select
                  disabled={!isEditing}
                  value={settings.speechSynthesizerVoice}
                  onChange={(e) => handleChange('speechSynthesizerVoice', e.target.value)}
                  className={selectClass}
                >
                  <option>Samantha (AI Voice - Warm & Conversational)</option>
                  <option>Alex (AI Voice - Strict Technical)</option>
                  <option>Ananya (Indian English - Professional)</option>
                  <option>David (Neutral English)</option>
                </select>
              </div>

              <label className={`flex items-start justify-between gap-4 border-t border-line pt-3 ${isEditing ? 'cursor-pointer' : 'cursor-default'}`}>
                <div>
                  <p className="text-sm font-semibold text-ink">In-Interview Sound Effects</p>
                  <p className="text-xs text-ink-soft">Play chime upon turn start and question submission</p>
                </div>
                <input
                  type="checkbox"
                  disabled={!isEditing}
                  checked={settings.soundEffects}
                  onChange={() => handleToggle('soundEffects')}
                  className={`h-4 w-4 rounded border-line text-signal focus:ring-signal ${!isEditing ? 'opacity-60 cursor-default' : ''}`}
                />
              </label>

              <label className={`flex items-start justify-between gap-4 border-t border-line pt-3 ${isEditing ? 'cursor-pointer' : 'cursor-default'}`}>
                <div>
                  <p className="text-sm font-semibold text-ink">Share Anonymous Benchmarks</p>
                  <p className="text-xs text-ink-soft">Allow comparison with anonymized peer scores across other universities</p>
                </div>
                <input
                  type="checkbox"
                  disabled={!isEditing}
                  checked={settings.privacyShareStats}
                  onChange={() => handleToggle('privacyShareStats')}
                  className={`h-4 w-4 rounded border-line text-signal focus:ring-signal ${!isEditing ? 'opacity-60 cursor-default' : ''}`}
                />
              </label>
            </div>
          </Panel>

          {/* Danger Zone */}
          <div className="rounded-xl border border-rose/30 bg-rose-soft/40 p-5">
            <div className="flex items-center gap-2 text-rose">
              <ShieldAlert size={18} />
              <h3 className="font-display text-sm font-bold">Data & Danger Zone</h3>
            </div>
            <p className="mt-2 text-xs text-ink-soft">
              Reset interview records or permanently delete your account and stored data.
            </p>

            <div className="mt-4 flex flex-wrap gap-2.5">
              <button
                type="button"
                disabled={!isEditing}
                onClick={handleResetHistory}
                className={`inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-xs font-semibold text-ink ${
                  isEditing ? 'hover:bg-paper cursor-pointer' : 'opacity-60 cursor-not-allowed'
                }`}
              >
                <RotateCcw size={14} /> Clear Interview History
              </button>
              <button
                type="button"
                disabled={!isEditing}
                onClick={() => setShowDeleteModal(true)}
                className={`inline-flex items-center gap-1.5 rounded-lg bg-rose px-3 py-2 text-xs font-semibold text-white ${
                  isEditing ? 'hover:bg-rose/90 cursor-pointer' : 'opacity-60 cursor-not-allowed'
                }`}
              >
                <Trash2 size={14} /> Delete Account & Data
              </button>
            </div>
            {!isEditing && (
              <p className="mt-2 text-[11px] text-ink-faint">
                Enter "Edit Settings" mode to unlock data management options.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 p-4">
          <div className="max-w-md rounded-2xl bg-surface p-6 shadow-pop">
            <div className="flex items-center gap-3 text-rose">
              <AlertTriangle size={24} />
              <h3 className="font-display text-lg font-bold">Delete Account & All Data?</h3>
            </div>
            <p className="mt-2 text-sm text-ink-soft">
              This will permanently remove your account, interview history, resume scan, and study plans from the database and local storage.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="btn-outline text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="btn-primary bg-rose hover:bg-rose/90 text-xs"
              >
                Yes, Delete Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
