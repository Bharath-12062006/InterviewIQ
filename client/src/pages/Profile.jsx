import { useEffect, useState } from 'react';
import {
  Mail, Award, MapPin, Github, Linkedin, Globe, Plus, X,
  CheckCircle, Save, Sparkles, Pencil, Undo2, AlertCircle,
} from 'lucide-react';
import { getUserProfile, saveUserProfile, initialUserProfile, getRegisteredUsers, saveRegisteredUsers } from '../data/mock';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import Panel from '../components/ui/Panel';

export default function Profile() {
  const { refreshUser } = useAuth();
  const [profile, setProfile] = useState(() => ({ ...initialUserProfile, ...getUserProfile() }));
  const [backupProfile, setBackupProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [savedToast, setSavedToast] = useState('');
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      try {
        const data = await api.get('/profile');
        if (active && data) {
          const merged = { ...initialUserProfile, ...data };
          setProfile(merged);
          saveUserProfile(merged);
          refreshUser();
        }
      } catch (err) {
        console.info('Profile DB sync notice:', err.message);
      }
    }
    loadProfile();
    return () => {
      active = false;
    };
  }, [refreshUser]);

  const handleStartEdit = () => {
    setBackupProfile(JSON.parse(JSON.stringify(profile)));
    setSaveError('');
    setSavedToast('');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (backupProfile) {
      setProfile(backupProfile);
    }
    setIsEditing(false);
    setSaveError('');
    setNewSkill('');
    setNewCompany('');
  };

  const handleChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    const trimmed = newSkill.trim();
    if (trimmed && !(profile.skills || []).includes(trimmed)) {
      setProfile((prev) => ({ ...prev, skills: [...(prev.skills || []), trimmed] }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    if (!isEditing) return;
    setProfile((prev) => ({
      ...prev,
      skills: (prev.skills || []).filter((s) => s !== skillToRemove),
    }));
  };

  const handleAddCompany = (e) => {
    e.preventDefault();
    const trimmed = newCompany.trim();
    if (trimmed && !(profile.targetCompanies || []).includes(trimmed)) {
      setProfile((prev) => ({ ...prev, targetCompanies: [...(prev.targetCompanies || []), trimmed] }));
      setNewCompany('');
    }
  };

  const handleRemoveCompany = (companyToRemove) => {
    if (!isEditing) return;
    setProfile((prev) => ({
      ...prev,
      targetCompanies: (prev.targetCompanies || []).filter((c) => c !== companyToRemove),
    }));
  };

  const syncLocalAuthAndUsers = (updatedProfile, previousEmail) => {
    saveUserProfile(updatedProfile);
    try {
      const rawSession = localStorage.getItem('interviewiq_auth_session');
      if (rawSession) {
        const parsed = JSON.parse(rawSession);
        if (parsed && updatedProfile.email && parsed.email !== updatedProfile.email) {
          localStorage.setItem(
            'interviewiq_auth_session',
            JSON.stringify({ ...parsed, email: updatedProfile.email }),
          );
        }
      }
      const registered = getRegisteredUsers();
      if (registered.length > 0) {
        const nextUsers = registered.map((u) =>
          u.email?.toLowerCase() === (previousEmail || updatedProfile.email)?.toLowerCase()
            ? { ...u, ...updatedProfile }
            : u,
        );
        saveRegisteredUsers(nextUsers);
      }
    } catch {}
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSaveError('');
    setSavedToast('');

    const previousEmail = backupProfile?.email || profile.email;

    try {
      const response = await api.put('/profile', profile);
      const updated = { ...initialUserProfile, ...(response?.profile || profile) };
      setProfile(updated);
      syncLocalAuthAndUsers(updated, previousEmail);
      refreshUser();
      window.dispatchEvent(new Event('profile-updated'));
      setIsEditing(false);
      setSavedToast('Profile saved to database and updated across InterviewIQ!');
      setTimeout(() => setSavedToast(''), 3500);
    } catch (err) {
      if (err.status && err.status >= 400 && err.status < 500) {
        setSaveError(err.message || 'Could not update profile in database.');
      } else {
        // Backend / MongoDB unreachable: save locally and inform user clearly
        syncLocalAuthAndUsers(profile, previousEmail);
        refreshUser();
        window.dispatchEvent(new Event('profile-updated'));
        setIsEditing(false);
        setSaveError(
          `Saved locally, but the database server could not be reached (${err.message}). Ensure MongoDB and the backend server are running.`,
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const inputClass = `mt-1.5 w-full rounded-lg border text-sm transition-all ${
    isEditing
      ? 'border-line bg-paper text-ink focus:bg-surface focus:outline-none focus:ring-2 focus:ring-signal'
      : 'border-line/60 bg-paper/50 text-ink/80 cursor-default focus:outline-none'
  }`;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Candidate Profile
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
            Manage your personal background, placement goals, and verified skills.
          </p>
        </div>

        {/* Action Buttons: Edit vs Save Changes */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {!isEditing ? (
            <button
              onClick={handleStartEdit}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Pencil size={15} /> Edit Profile
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
                onClick={handleSave}
                disabled={saving}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Save size={15} /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Save Success Toast */}
      {savedToast && (
        <div className="flex items-center gap-2.5 rounded-xl border border-jade/30 bg-jade-soft px-4 py-3 text-sm font-semibold text-jade">
          <CheckCircle size={18} /> {savedToast}
        </div>
      )}

      {/* Save Error / DB Warning */}
      {saveError && (
        <div className="flex items-center gap-2.5 rounded-xl border border-rose/30 bg-rose-soft px-4 py-3 text-sm font-semibold text-rose">
          <AlertCircle size={18} className="shrink-0" /> {saveError}
        </div>
      )}

      {/* Profile Overview Card */}
      <div className="rounded-xl bg-navy-900 p-6 text-white shadow-panel dark:border dark:border-line lg:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-signal text-xl font-bold text-white shadow-lg">
              {(profile.name || 'U').split(' ').filter(Boolean).map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="font-display text-xl font-bold">{profile.name || 'Student Candidate'}</h2>
                <span className="rounded-full bg-signal-soft/20 px-2.5 py-0.5 text-xs font-semibold text-signal-soft">
                  Verified Student
                </span>
              </div>
              <p className="mt-0.5 text-sm text-white/70">{profile.title || 'Candidate'} {profile.university ? `· ${profile.university}` : ''}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-white/60">
                {profile.email && <span className="flex items-center gap-1"><Mail size={13} /> {profile.email}</span>}
                {profile.location && <span className="flex items-center gap-1"><MapPin size={13} /> {profile.location}</span>}
                {profile.cgpa && <span className="flex items-center gap-1"><Award size={13} /> CGPA: {profile.cgpa}</span>}
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-navy-800 p-4 sm:text-right">
            <span className="text-xs font-semibold uppercase tracking-wider text-signal-soft">Targeting</span>
            <p className="font-display text-lg font-bold text-white">{profile.targetRole || 'Software Engineer'}</p>
            <p className="text-xs text-white/60">{(profile.targetCompanies || []).length} dream companies shortlisted</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Columns: Forms */}
        <div className="space-y-6 lg:col-span-2">
          {/* Basic Information */}
          <Panel title="Personal & Contact Details">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-ink-soft">Full Name</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={profile.name || ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className={`${inputClass} px-3 py-2`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-soft">Email Address</label>
                <input
                  type="email"
                  disabled={!isEditing}
                  value={profile.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={`${inputClass} px-3 py-2`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-soft">Phone Number</label>
                <input
                  type="tel"
                  disabled={!isEditing}
                  value={profile.phone || ''}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className={`${inputClass} px-3 py-2`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-soft">Preferred Locations</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={profile.location || ''}
                  onChange={(e) => handleChange('location', e.target.value)}
                  className={`${inputClass} px-3 py-2`}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-ink-soft">Professional Bio</label>
                <textarea
                  rows={3}
                  disabled={!isEditing}
                  value={profile.bio || ''}
                  onChange={(e) => handleChange('bio', e.target.value)}
                  className={`${inputClass} p-3`}
                />
              </div>
            </div>
          </Panel>

          {/* Academic Background */}
          <Panel title="Education & Academic Background">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-ink-soft">College / University</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={profile.university || ''}
                  onChange={(e) => handleChange('university', e.target.value)}
                  className={`${inputClass} px-3 py-2`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-soft">Degree & Major</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={profile.degree || ''}
                  onChange={(e) => handleChange('degree', e.target.value)}
                  className={`${inputClass} px-3 py-2`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-soft">Graduation Year</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={profile.gradYear || ''}
                  onChange={(e) => handleChange('gradYear', e.target.value)}
                  className={`${inputClass} px-3 py-2`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-soft">Current CGPA</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={profile.cgpa || ''}
                  onChange={(e) => handleChange('cgpa', e.target.value)}
                  className={`${inputClass} px-3 py-2`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-soft">Student Status / Title</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={profile.title || ''}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className={`${inputClass} px-3 py-2`}
                />
              </div>
            </div>
          </Panel>

          {/* Target Role & Shortlisted Companies */}
          <Panel title="Placement Goals & Dream Companies">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink-soft">Target Role</label>
                <select
                  disabled={!isEditing}
                  value={profile.targetRole || 'Software Engineer'}
                  onChange={(e) => handleChange('targetRole', e.target.value)}
                  className={`${inputClass} px-3 py-2.5`}
                >
                  <option value="Software Engineer">Software Engineer (SDE / SWE)</option>
                  <option value="Frontend Engineer">Frontend Engineer (React / Next.js)</option>
                  <option value="Backend Engineer">Backend Engineer (Distributed Systems / APIs)</option>
                  <option value="Full Stack Developer">Full Stack Developer</option>
                  <option value="Data Engineer">Data Engineer / Analyst</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-soft">Target Companies</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(profile.targetCompanies || []).map((company) => (
                    <span
                      key={company}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-navy-900 px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      {company}
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCompany(company)}
                          className="rounded hover:bg-white/20"
                          title="Remove"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </span>
                  ))}
                </div>

                {isEditing ? (
                  <form onSubmit={handleAddCompany} className="mt-3 flex gap-2">
                    <input
                      type="text"
                      placeholder="Add target company (e.g. Cisco, Uber)..."
                      value={newCompany}
                      onChange={(e) => setNewCompany(e.target.value)}
                      className="flex-1 rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink focus:bg-surface focus:outline-none focus:ring-2 focus:ring-signal"
                    />
                    <button type="submit" className="btn-outline text-xs">
                      <Plus size={14} /> Add
                    </button>
                  </form>
                ) : (
                  <p className="mt-2 text-[11px] text-ink-faint">
                    Click "Edit Profile" above to add or remove companies.
                  </p>
                )}
              </div>
            </div>
          </Panel>
        </div>

        {/* Right Column: Skills & Portfolio */}
        <div className="space-y-6">
          {/* Skills Tag Cloud */}
          <Panel title="Technical Skills">
            <p className="text-xs text-ink-soft">
              Interview questions and resume matches are tuned using these skills:
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(profile.skills || []).map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 rounded-lg bg-signal-soft px-2.5 py-1 text-xs font-semibold text-signal-deep"
                >
                  {skill}
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="rounded text-signal-deep/60 hover:text-signal-deep"
                      title={`Remove ${skill}`}
                    >
                      <X size={12} />
                    </button>
                  )}
                </span>
              ))}
            </div>

            {isEditing ? (
              <form onSubmit={handleAddSkill} className="mt-4 flex gap-2">
                <input
                  type="text"
                  placeholder="Add skill (e.g. Docker, Redis)..."
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  className="flex-1 rounded-lg border border-line bg-paper px-3 py-2 text-xs text-ink focus:bg-surface focus:outline-none focus:ring-2 focus:ring-signal"
                />
                <button type="submit" className="btn-outline px-3 py-1.5 text-xs">
                  <Plus size={14} /> Add
                </button>
              </form>
            ) : (
              <p className="mt-3 text-[11px] text-ink-faint">
                Click "Edit Profile" to add or remove skills.
              </p>
            )}
          </Panel>

          {/* Social Profiles */}
          <Panel title="Profiles & Portfolios">
            <div className="space-y-3">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
                  <Github size={14} /> GitHub Profile
                </label>
                <input
                  type="url"
                  disabled={!isEditing}
                  value={profile.github || ''}
                  onChange={(e) => handleChange('github', e.target.value)}
                  className={`${inputClass} px-3 py-2 text-xs`}
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
                  <Linkedin size={14} /> LinkedIn Profile
                </label>
                <input
                  type="url"
                  disabled={!isEditing}
                  value={profile.linkedin || ''}
                  onChange={(e) => handleChange('linkedin', e.target.value)}
                  className={`${inputClass} px-3 py-2 text-xs`}
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
                  <Globe size={14} /> Portfolio Website
                </label>
                <input
                  type="url"
                  disabled={!isEditing}
                  value={profile.portfolio || ''}
                  onChange={(e) => handleChange('portfolio', e.target.value)}
                  className={`${inputClass} px-3 py-2 text-xs`}
                />
              </div>
            </div>
          </Panel>

          {/* Placement AI Card */}
          <div className="rounded-xl border border-signal/20 bg-signal-soft/40 p-5">
            <div className="flex items-center gap-2 text-signal-deep">
              <Sparkles size={18} />
              <h3 className="font-display text-sm font-bold">AI Placement Readiness</h3>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-ink-soft">
              Adding verified projects and keeping your academic background up to date boosts recruiter benchmark scores.
            </p>
            <div className="mt-4">
              <a
                href="/resume"
                className="btn-primary w-full text-center text-xs"
              >
                Scan Resume with AI
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
