import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, UploadCloud, CheckCircle2, AlertCircle, Sparkles,
  ArrowRight, BookOpen, Briefcase, GraduationCap, Code2, RefreshCw,
  Trash2, Check, AlertTriangle, Info, Clock, Target, Award, Layers,
} from 'lucide-react';
import { saveResumeData } from '../data/mock';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import Panel from '../components/ui/Panel';

export default function ResumeAnalyzer() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [resume, setResume] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  const [selectedFile, setSelectedFile] = useState(null);
  const [targetRole, setTargetRole] = useState(user?.targetRole || 'Software Engineer');
  const [jobDescription, setJobDescription] = useState('');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState('match');

  const fetchLatestAndHistory = async () => {
    setLoadingInitial(true);
    try {
      const [latestRes, historyRes] = await Promise.allSettled([
        api.get('/resume'),
        api.get('/resume/history'),
      ]);

      if (latestRes.status === 'fulfilled' && latestRes.value?.fileName) {
        setResume(latestRes.value);
        saveResumeData(latestRes.value);
      } else {
        setResume(null);
      }

      if (historyRes.status === 'fulfilled' && Array.isArray(historyRes.value)) {
        setHistory(historyRes.value);
      }
    } catch (err) {
      if (err?.status !== 404) {
        setErrorMsg(err?.message || 'Unable to load saved resume reports.');
      }
    } finally {
      setLoadingInitial(false);
    }
  };

  useEffect(() => {
    fetchLatestAndHistory();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith('.pdf') && !lowerName.endsWith('.docx')) {
      setErrorMsg('Unsupported file format. Please select a .pdf or .docx resume.');
      setSelectedFile(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('File size exceeds the 5 MB limit.');
      setSelectedFile(null);
      return;
    }

    setErrorMsg('');
    setSelectedFile(file);
  };

  const handleAnalyzeSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedFile) {
      setErrorMsg('Please select a PDF or DOCX resume file to analyze.');
      return;
    }
    if (!targetRole.trim() && !jobDescription.trim()) {
      setErrorMsg('Please enter a Target Job Title or paste a Job Description.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('targetRole', targetRole.trim());
      formData.append('jobDescription', jobDescription.trim());

      const response = await api.post('/resume/analyze', formData);
      if (!response?.resume) {
        throw new Error('Server returned an empty analysis response.');
      }

      setResume(response.resume);
      saveResumeData(response.resume);
      setActiveTab('match');
      setSelectedFile(null);

      // Refresh history from MongoDB
      try {
        const updatedHistory = await api.get('/resume/history');
        if (Array.isArray(updatedHistory)) {
          setHistory(updatedHistory);
        }
      } catch {}
    } catch (err) {
      setErrorMsg(err.message || 'Resume analysis failed. Please check your file and try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectReport = async (id) => {
    setErrorMsg('');
    try {
      const doc = await api.get(`/resume/${encodeURIComponent(id)}`);
      if (doc) {
        setResume(doc);
        saveResumeData(doc);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Could not load selected report.');
    }
  };

  const handleDeleteReport = async (id, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/resume/${encodeURIComponent(id)}`);
      const nextHistory = history.filter((item) => item._id !== id);
      setHistory(nextHistory);
      if (resume?._id === id) {
        if (nextHistory.length > 0) {
          handleSelectReport(nextHistory[0]._id);
        } else {
          setResume(null);
          saveResumeData(null);
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete report.');
    }
  };

  const startInterviewWithQuestion = (question, category) => {
    navigate(
      `/interview/room?category=${encodeURIComponent(category)}&seedQuestion=${encodeURIComponent(question)}&mode=Friendly`,
    );
  };

  const matchedSkills = resume?.skillMatch?.matched || [];
  const partialSkills = resume?.skillMatch?.partial || [];
  const missingSkills = resume?.skillMatch?.missing || [];
  const components = resume?.components || [];
  const extracted = resume?.extracted || {};
  const contact = resume?.contact || {};
  const keywords = resume?.keywords || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            AI Resume & ATS Analyzer
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Upload a real PDF or DOCX resume and compare it against your target job description for explainable ATS scoring and personalized feedback.
          </p>
        </div>
      </div>

      {/* Upload & Job Description Form */}
      <Panel
        title="Analyze Resume Against Job Description"
        description="Text is extracted directly from your PDF or DOCX document and matched against the job requirements below."
      >
        <form onSubmit={handleAnalyzeSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-ink-soft">
                Target Job Title <span className="text-rose">*</span>
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Backend Software Engineer, Data Analyst"
                className="mt-1.5 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink focus:bg-surface focus:outline-none focus:ring-2 focus:ring-signal"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-soft">
                Resume File (.pdf or .docx, max 5 MB) <span className="text-rose">*</span>
              </label>
              <label className="mt-1.5 flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-dashed border-signal/50 bg-paper px-3.5 py-2 text-xs text-ink hover:bg-signal-soft/30">
                <span className="flex items-center gap-2 truncate font-semibold">
                  <UploadCloud size={16} className="shrink-0 text-signal" />
                  {selectedFile ? selectedFile.name : 'Choose PDF or DOCX file...'}
                </span>
                {selectedFile && (
                  <span className="shrink-0 text-[11px] text-ink-soft">
                    {(selectedFile.size / 1024).toFixed(0)} KB
                  </span>
                )}
                <input
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-soft">
              Job Description (Paste full posting for accurate skill, keyword & experience matching)
            </label>
            <textarea
              rows={5}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here (required skills, preferred qualifications, frameworks, tools, education, and experience)..."
              className="mt-1.5 w-full rounded-lg border border-line bg-paper p-3 text-xs leading-relaxed text-ink placeholder:text-ink-faint focus:bg-surface focus:outline-none focus:ring-2 focus:ring-signal"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] text-ink-faint">
              Supports text PDFs, scanned PDFs (OCR fallback), and Word DOCX resumes.
            </p>
            <button
              type="submit"
              disabled={isAnalyzing}
              className="btn-primary inline-flex items-center gap-2 text-xs"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw size={15} className="animate-spin" /> Extracting & Matching...
                </>
              ) : (
                <>
                  <Sparkles size={15} /> Analyze Resume with AI
                </>
              )}
            </button>
          </div>
        </form>
      </Panel>

      {errorMsg && (
        <div className="flex items-center gap-2.5 rounded-xl border border-rose/30 bg-rose-soft px-4 py-3 text-sm font-semibold text-rose">
          <AlertCircle size={18} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Previous Reports History */}
      {history.length > 0 && (
        <div className="rounded-xl border border-line bg-surface p-4 shadow-panel">
          <div className="flex items-center justify-between gap-2 pb-2.5">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-faint">
              <Clock size={13} /> Saved ATS Reports ({history.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {history.map((item) => {
              const active = resume?._id === item._id;
              return (
                <div
                  key={item._id}
                  onClick={() => handleSelectReport(item._id)}
                  className={`group flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-1.5 text-xs transition-all ${
                    active
                      ? 'border-signal bg-signal-soft text-signal-deep font-semibold'
                      : 'border-line bg-paper text-ink-soft hover:border-signal/50 hover:text-ink'
                  }`}
                >
                  <span className="max-w-[160px] truncate">{item.fileName}</span>
                  <span className="text-[11px] opacity-75">· {item.targetRole}</span>
                  <span className="rounded bg-surface px-1.5 py-0.5 text-[11px] font-bold text-ink">
                    {item.atsScore}%
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteReport(item._id, e)}
                    aria-label="Delete report"
                    className="rounded p-0.5 text-ink-faint hover:text-rose"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Analyzing Loader */}
      {isAnalyzing && (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-surface p-12 text-center shadow-panel">
          <RefreshCw size={36} className="animate-spin text-signal" />
          <h3 className="mt-4 font-display text-lg font-bold text-ink">
            Extracting Text, Parsing Sections & Matching Job Requirements...
          </h3>
          <p className="mt-1 text-sm text-ink-soft">
            Running PDF/DOCX extraction, NLP entity parsing, skill taxonomy matching, and TF-IDF similarity scoring.
          </p>
        </div>
      )}

      {/* Empty State before first upload */}
      {!loadingInitial && !isAnalyzing && !resume && (
        <div className="rounded-2xl border border-dashed border-line bg-surface p-12 text-center shadow-panel">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-signal-soft text-signal">
            <FileText size={28} />
          </div>
          <h2 className="mt-4 font-display text-lg font-bold text-ink">
            No Resume Analyzed Yet
          </h2>
          <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-ink-soft">
            Upload your PDF or DOCX resume and enter a job description above to generate a genuine, explainable ATS report stored in your account.
          </p>
        </div>
      )}

      {/* Dynamic ATS Report */}
      {!isAnalyzing && resume && (
        <>
          {/* Top Banner Stats */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* File Info */}
            <div className="rounded-xl bg-surface p-5 shadow-panel">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-signal-soft text-signal">
                  <FileText size={24} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink">{resume.fileName}</p>
                  <p className="text-xs text-ink-soft">
                    {resume.fileSize} · {resume.format?.toUpperCase()} ({resume.extractionMethod}) · {resume.wordCount} words
                  </p>
                  <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-jade">
                    <CheckCircle2 size={12} /> Analyzed {resume.uploadDate}
                  </span>
                </div>
              </div>
            </div>

            {/* Dynamic ATS Score */}
            <div className="rounded-xl bg-surface p-5 shadow-panel">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
                    ATS Match Score
                  </p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="font-display text-3xl font-bold text-ink">{resume.atsScore}%</span>
                    <span
                      className={`text-xs font-semibold ${
                        resume.atsScore >= 70
                          ? 'text-jade'
                          : resume.atsScore >= 50
                          ? 'text-saffron'
                          : 'text-rose'
                      }`}
                    >
                      {resume.scoreBand || 'Evaluated'}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-ink-soft">for {resume.targetRole}</p>
                </div>
                <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-signal-soft">
                  <span className="font-display text-sm font-bold text-signal-deep">{resume.atsScore}</span>
                </div>
              </div>
            </div>

            {/* Skill & Keyword Summary */}
            <div className="flex flex-col justify-between rounded-xl bg-navy-900 p-5 text-white shadow-panel dark:border dark:border-line">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-signal-soft">
                  Match Summary
                </p>
                <p className="mt-1 text-sm font-semibold">
                  {matchedSkills.length} matched · {partialSkills.length} partial · {missingSkills.length} missing skills
                </p>
                <p className="mt-1 text-xs text-white/70">
                  Keyword coverage: {keywords.coverage ?? 0}% · Similarity: {keywords.semanticSimilarity ?? 0}%
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('questions')}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-signal-soft hover:text-white"
              >
                View {resume.suggestedQuestions?.length || 0} Tailored Questions <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Executive Summary & Disclaimer */}
          <div className="rounded-xl border border-line bg-surface p-4 shadow-panel">
            <p className="text-xs leading-relaxed text-ink">{resume.summary}</p>
            {resume.disclaimer && (
              <p className="mt-2 flex items-start gap-1.5 text-[11px] text-ink-faint">
                <Info size={13} className="mt-0.5 shrink-0" />
                <span>{resume.disclaimer}</span>
              </p>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap border-b border-line">
            {[
              { id: 'match', label: 'ATS Score & Skill Match' },
              { id: 'feedback', label: 'Personalized AI Feedback' },
              { id: 'extracted', label: 'Extracted Resume Data' },
              { id: 'questions', label: `Interview Questions (${resume.suggestedQuestions?.length || 0})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
                  activeTab === tab.id
                    ? 'border-signal text-signal'
                    : 'border-transparent text-ink-soft hover:text-ink'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab 1: ATS Score Breakdown & Skill Match */}
          {activeTab === 'match' && (
            <div className="space-y-6">
              {/* Weighted Components */}
              <Panel
                title="Weighted ATS Score Breakdown"
                description={`Scoring engine: ${resume.scoringVersion || 'ats-heuristic-v1'} (weights sum to 100%)`}
              >
                <div className="space-y-4">
                  {components.map((comp) => (
                    <div key={comp.key} className="rounded-xl border border-line bg-paper/50 p-3.5">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="font-display font-bold text-ink">
                          {comp.label}{' '}
                          <span className="font-sans font-normal text-ink-faint">
                            (Weight: {comp.weight}%)
                          </span>
                        </span>
                        <span className="font-bold text-signal">
                          {comp.score}% <span className="text-ink-faint font-normal">(+{comp.weightedContribution} pts)</span>
                        </span>
                      </div>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-line">
                        <div
                          className={`h-full rounded-full ${
                            comp.score >= 75 ? 'bg-jade' : comp.score >= 50 ? 'bg-signal' : 'bg-saffron'
                          }`}
                          style={{ width: `${comp.score}%` }}
                        />
                      </div>
                      <p className="mt-2 text-xs text-ink-soft">{comp.explanation}</p>
                    </div>
                  ))}
                </div>
              </Panel>

              {/* Skill Match Buckets */}
              <div className="grid gap-6 lg:grid-cols-3">
                <Panel title={`Matched Skills (${matchedSkills.length})`}>
                  {matchedSkills.length === 0 ? (
                    <p className="text-xs text-ink-soft">No direct JD skill matches detected.</p>
                  ) : (
                    <ul className="space-y-2.5">
                      {matchedSkills.map((item, idx) => (
                        <li key={idx} className="rounded-lg border border-jade/25 bg-jade-soft/35 p-3 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-ink flex items-center gap-1.5">
                              <Check size={13} className="text-jade" /> {item.skill}
                            </span>
                            <span className="rounded bg-surface px-2 py-0.5 text-[10px] font-semibold uppercase text-ink-soft">
                              {item.priority}
                            </span>
                          </div>
                          <p className="mt-1 text-ink-soft">{item.reason}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </Panel>

                <Panel title={`Partially Matched (${partialSkills.length})`}>
                  {partialSkills.length === 0 ? (
                    <p className="text-xs text-ink-soft">No partial family overlaps detected.</p>
                  ) : (
                    <ul className="space-y-2.5">
                      {partialSkills.map((item, idx) => (
                        <li key={idx} className="rounded-lg border border-saffron/25 bg-saffron-soft/35 p-3 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-ink">{item.skill}</span>
                            <span className="rounded bg-surface px-2 py-0.5 text-[10px] font-semibold uppercase text-saffron">
                              Partial
                            </span>
                          </div>
                          <p className="mt-1 text-ink-soft">{item.reason}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </Panel>

                <Panel title={`Missing Skills (${missingSkills.length})`}>
                  {missingSkills.length === 0 ? (
                    <p className="text-xs text-jade font-semibold">All extracted JD skills were found!</p>
                  ) : (
                    <ul className="space-y-2.5">
                      {missingSkills.map((item, idx) => (
                        <li key={idx} className="rounded-lg border border-rose/25 bg-rose-soft/35 p-3 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-ink">{item.skill}</span>
                            <span className="rounded bg-surface px-2 py-0.5 text-[10px] font-semibold uppercase text-rose">
                              {item.priority}
                            </span>
                          </div>
                          <p className="mt-1 text-ink-soft">{item.reason}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </Panel>
              </div>

              {/* Keywords & JD Requirements */}
              <div className="grid gap-6 lg:grid-cols-2">
                <Panel title="Job Description Keyword Coverage">
                  <div className="space-y-3 text-xs">
                    <div>
                      <p className="font-semibold text-jade mb-1.5">
                        Present in Resume ({keywords.matchedCount || 0})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {(keywords.matched || []).map((k) => (
                          <span
                            key={k.keyword}
                            className="rounded-md bg-jade-soft px-2 py-0.5 font-semibold text-jade"
                          >
                            {k.keyword}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-line pt-3">
                      <p className="font-semibold text-rose mb-1.5">
                        Missing from Resume ({keywords.missingCount || 0})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {(keywords.missing || []).map((k) => (
                          <span
                            key={k.keyword}
                            className="rounded-md bg-rose-soft px-2 py-0.5 font-semibold text-rose"
                          >
                            {k.keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Panel>

                <Panel title="Detected Job Requirements">
                  <div className="space-y-3 text-xs">
                    <div>
                      <p className="font-semibold text-ink-soft">Education Requirements</p>
                      {resume.jobAnalysis?.educationRequirements?.length ? (
                        <ul className="mt-1 list-disc pl-4 text-ink">
                          {resume.jobAnalysis.educationRequirements.map((req, idx) => (
                            <li key={idx}>{req}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-1 text-ink-faint">No strict degree clause detected in JD.</p>
                      )}
                    </div>

                    <div className="border-t border-line pt-3">
                      <p className="font-semibold text-ink-soft">Experience Requirements</p>
                      {resume.jobAnalysis?.experienceRequirements?.length ? (
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {resume.jobAnalysis.experienceRequirements.map((exp, idx) => (
                            <span
                              key={idx}
                              className="rounded-md bg-signal-soft px-2.5 py-0.5 font-semibold text-signal-deep"
                            >
                              {exp}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-1 text-ink-faint">No explicit years-of-experience requirement stated.</p>
                      )}
                    </div>
                  </div>
                </Panel>
              </div>
            </div>
          )}

          {/* Tab 2: Personalized AI Feedback */}
          {activeTab === 'feedback' && (
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Panel title="Resume Strengths">
                  <ul className="space-y-2.5">
                    {(resume.strengths || []).map((str, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-ink-soft">
                        <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-jade" />
                        <span className="leading-relaxed text-ink">{str}</span>
                      </li>
                    ))}
                  </ul>
                </Panel>

                <Panel title="Resume Weaknesses & Gaps">
                  {(resume.weaknesses || []).length === 0 ? (
                    <p className="text-xs text-jade font-semibold">No critical resume gaps flagged.</p>
                  ) : (
                    <ul className="space-y-2.5">
                      {(resume.weaknesses || []).map((wk, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-ink-soft">
                          <AlertTriangle size={15} className="mt-0.5 shrink-0 text-saffron" />
                          <span className="leading-relaxed text-ink">{wk}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Panel>
              </div>

              {/* Relevant Experience & Projects */}
              <div className="grid gap-6 md:grid-cols-2">
                <Panel title="Relevant Experience Alignment">
                  {!(resume.relevantExperience || []).length ? (
                    <p className="text-xs text-ink-soft">No experience entries detected in uploaded resume.</p>
                  ) : (
                    <div className="space-y-3">
                      {resume.relevantExperience.map((exp, idx) => (
                        <div key={idx} className="rounded-lg border border-line bg-paper/50 p-3 text-xs">
                          <p className="font-bold text-ink">
                            {exp.role || 'Role'} {exp.company ? `· ${exp.company}` : ''}
                          </p>
                          {exp.period && <p className="text-[11px] text-ink-faint">{exp.period}</p>}
                          <div className="mt-2 flex flex-wrap gap-1">
                            {(exp.matchedSkills || []).map((s) => (
                              <span key={s} className="rounded bg-signal-soft px-2 py-0.5 text-[11px] font-semibold text-signal-deep">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Panel>

                <Panel title="Relevant Projects Alignment">
                  {!(resume.relevantProjects || []).length ? (
                    <p className="text-xs text-ink-soft">No project entries detected in uploaded resume.</p>
                  ) : (
                    <div className="space-y-3">
                      {resume.relevantProjects.map((proj, idx) => (
                        <div key={idx} className="rounded-lg border border-line bg-paper/50 p-3 text-xs">
                          <p className="font-bold text-ink">{proj.name}</p>
                          {proj.tech && <p className="text-[11px] text-ink-soft">{proj.tech}</p>}
                          <div className="mt-2 flex flex-wrap gap-1">
                            {(proj.matchedSkills || []).map((s) => (
                              <span key={s} className="rounded bg-jade-soft px-2 py-0.5 text-[11px] font-semibold text-jade">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Panel>
              </div>

              {/* Actionable Recommendations */}
              <Panel title="Specific Improvement Suggestions & Skills to Learn">
                <div className="grid gap-3 md:grid-cols-2">
                  {(resume.recommendations || []).map((rec, idx) => (
                    <div key={idx} className="rounded-xl border border-line bg-paper/50 p-4 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-display font-bold text-ink">{rec.title}</span>
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                            rec.priority === 'high'
                              ? 'bg-rose-soft text-rose'
                              : rec.priority === 'medium'
                              ? 'bg-saffron-soft text-saffron'
                              : 'bg-signal-soft text-signal-deep'
                          }`}
                        >
                          {rec.priority}
                        </span>
                      </div>
                      <p className="mt-1.5 leading-relaxed text-ink-soft">{rec.detail}</p>
                    </div>
                  ))}
                </div>
              </Panel>

              {/* Project Suggestions */}
              {(resume.projectSuggestions || []).length > 0 && (
                <Panel title="Recommended Projects to Close Skill Gaps">
                  <div className="grid gap-3 md:grid-cols-2">
                    {resume.projectSuggestions.map((ps, idx) => (
                      <div key={idx} className="rounded-xl border border-line bg-paper/50 p-4 text-xs">
                        <p className="font-display font-bold text-ink flex items-center gap-1.5">
                          <Target size={14} className="text-signal" /> {ps.title}
                        </p>
                        <p className="mt-1.5 leading-relaxed text-ink-soft">{ps.detail}</p>
                      </div>
                    ))}
                  </div>
                </Panel>
              )}
            </div>
          )}

          {/* Tab 3: Extracted Resume Content */}
          {activeTab === 'extracted' && (
            <div className="space-y-6">
              {/* Contact & Summary */}
              <Panel title="Extracted Candidate Details">
                <div className="grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <span className="text-ink-faint">Name</span>
                    <p className="font-semibold text-ink">{contact.name || 'Not detected'}</p>
                  </div>
                  <div>
                    <span className="text-ink-faint">Email</span>
                    <p className="font-semibold text-ink">{contact.email || 'Not detected'}</p>
                  </div>
                  <div>
                    <span className="text-ink-faint">Phone</span>
                    <p className="font-semibold text-ink">{contact.phone || 'Not detected'}</p>
                  </div>
                  <div>
                    <span className="text-ink-faint">Location</span>
                    <p className="font-semibold text-ink">{contact.location || 'Not detected'}</p>
                  </div>
                </div>
                {extracted.summary && (
                  <p className="mt-4 border-t border-line pt-3 text-xs leading-relaxed text-ink-soft">
                    <strong className="text-ink">Extracted Summary:</strong> {extracted.summary}
                  </p>
                )}
              </Panel>

              {/* Skills parsed */}
              <Panel title={`Identified Skills (${(extracted.skills || []).length})`}>
                {(extracted.skills || []).length === 0 ? (
                  <p className="text-xs text-ink-soft">No canonical skills extracted.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {extracted.skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-paper px-3 py-1.5 text-xs font-semibold text-ink shadow-sm"
                      >
                        <Code2 size={13} className="text-signal" /> {skill}
                      </span>
                    ))}
                  </div>
                )}
              </Panel>

              {/* Projects parsed */}
              <Panel title={`Extracted Projects (${(extracted.projects || []).length})`}>
                {(extracted.projects || []).length === 0 ? (
                  <p className="text-xs text-ink-soft">No projects section parsed from the uploaded file.</p>
                ) : (
                  <div className="space-y-4">
                    {extracted.projects.map((proj, idx) => (
                      <div key={idx} className="rounded-xl border border-line bg-paper/50 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="font-display text-sm font-bold text-ink">{proj.name}</h4>
                          {proj.tech && (
                            <span className="rounded-md bg-signal-soft px-2.5 py-0.5 text-xs font-semibold text-signal-deep">
                              {proj.tech}
                            </span>
                          )}
                        </div>
                        {proj.description && (
                          <p className="mt-2 text-xs leading-relaxed text-ink-soft">{proj.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Panel>

              {/* Work Experience */}
              <Panel title={`Experience & Internships (${(extracted.experience || []).length})`}>
                {(extracted.experience || []).length === 0 ? (
                  <p className="text-xs text-ink-soft">No experience section parsed from the uploaded file.</p>
                ) : (
                  <div className="space-y-4">
                    {extracted.experience.map((exp, idx) => (
                      <div key={idx} className="rounded-xl border border-line bg-paper/50 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Briefcase size={16} className="text-signal" />
                            <h4 className="font-display text-sm font-bold text-ink">
                              {exp.role} {exp.company ? `· ${exp.company}` : ''}
                            </h4>
                          </div>
                          <span className="text-xs text-ink-faint">
                            {exp.period} {exp.location ? `· ${exp.location}` : ''}
                          </span>
                        </div>
                        {exp.points?.length > 0 && (
                          <ul className="mt-2.5 list-disc space-y-1 pl-5 text-xs text-ink-soft">
                            {exp.points.map((pt, pIdx) => (
                              <li key={pIdx}>{pt}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Panel>

              {/* Education & Certifications */}
              <div className="grid gap-6 md:grid-cols-2">
                <Panel title={`Academic History (${(extracted.education || []).length})`}>
                  {(extracted.education || []).length === 0 ? (
                    <p className="text-xs text-ink-soft">No education entries parsed.</p>
                  ) : (
                    <div className="space-y-3">
                      {extracted.education.map((edu, idx) => (
                        <div key={idx} className="flex items-start gap-3 rounded-xl border border-line p-4">
                          <GraduationCap size={20} className="mt-0.5 text-signal" />
                          <div>
                            <p className="text-sm font-bold text-ink">{edu.institution || edu.degree}</p>
                            {edu.institution && edu.degree && (
                              <p className="text-xs text-ink-soft">{edu.degree}</p>
                            )}
                            {(edu.grade || edu.period) && (
                              <p className="mt-1 text-xs font-semibold text-signal-deep">
                                {[edu.grade, edu.period].filter(Boolean).join(' · ')}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Panel>

                <Panel title={`Certifications (${(extracted.certifications || []).length})`}>
                  {(extracted.certifications || []).length === 0 ? (
                    <p className="text-xs text-ink-soft">No certifications section parsed.</p>
                  ) : (
                    <ul className="space-y-2 text-xs text-ink">
                      {extracted.certifications.map((cert, idx) => (
                        <li key={idx} className="flex items-start gap-2 rounded-lg border border-line p-2.5">
                          <Award size={14} className="mt-0.5 shrink-0 text-signal" />
                          <span>{cert}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Panel>
              </div>
            </div>
          )}

          {/* Tab 4: Tailored Interview Questions */}
          {activeTab === 'questions' && (
            <div className="space-y-4">
              <div className="rounded-xl bg-navy-900 p-5 text-white dark:border dark:border-line">
                <div className="flex items-center gap-2 text-signal-soft">
                  <Layers size={18} />
                  <h3 className="font-display text-sm font-bold">
                    Resume & Job-Specific Interview Questions
                  </h3>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-white/70">
                  Generated directly from your extracted projects, experience, and missing job requirements.
                </p>
              </div>

              <div className="grid gap-4">
                {(resume.suggestedQuestions || []).map((q, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col justify-between gap-4 rounded-xl bg-surface p-5 shadow-panel sm:flex-row sm:items-center"
                  >
                    <div className="space-y-1">
                      <span className="inline-block rounded-md bg-signal-soft px-2.5 py-0.5 text-xs font-semibold text-signal-deep">
                        {q.category}
                      </span>
                      <p className="font-display text-sm font-semibold text-ink sm:text-base">
                        "{q.question}"
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => startInterviewWithQuestion(q.question, q.category)}
                      className="btn-primary shrink-0 self-start text-xs sm:self-auto"
                    >
                      Practice in Live Room <ArrowRight size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
