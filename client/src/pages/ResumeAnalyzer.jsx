import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, UploadCloud, CheckCircle2, AlertCircle, Sparkles,
  ArrowRight, BookOpen, Briefcase, GraduationCap, Code2, RefreshCw,
} from 'lucide-react';
import { getResumeData, saveResumeData } from '../data/mock';
import { api } from '../lib/api';
import Panel from '../components/ui/Panel';

export default function ResumeAnalyzer() {
  const navigate = useNavigate();
  const [resume, setResume] = useState(getResumeData());
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [activeTab, setActiveTab] = useState('extracted');

  useEffect(() => {
    let active = true;
    async function loadResume() {
      try {
        const remote = await api.get('/resume');
        if (active && remote?.fileName) {
          setResume(remote);
          saveResumeData(remote);
        }
      } catch (err) {
        if (err.status !== 404) {
          console.info('Resume DB sync notice:', err.message);
        }
      }
    }
    loadResume();
    return () => {
      active = false;
    };
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      setUploadError('Please upload a valid PDF document (.pdf format only).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size exceeds the 5 MB limit.');
      return;
    }

    setUploadError('');
    setIsUploading(true);

    // Simulate AI parsing delay and persist to MongoDB
    setTimeout(async () => {
      const updated = {
        ...resume,
        fileName: file.name,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        uploadDate: new Date().toISOString().split('T')[0],
        atsScore: 88,
      };
      try {
        const res = await api.post('/resume', updated);
        const saved = res?.resume || updated;
        setResume(saved);
        saveResumeData(saved);
      } catch (err) {
        console.info('Resume save DB notice:', err.message);
        setResume(updated);
        saveResumeData(updated);
      } finally {
        setIsUploading(false);
      }
    }, 1500);
  };

  const startInterviewWithQuestion = (question, category) => {
    navigate(`/interview/room?category=${encodeURIComponent(category)}&seedQuestion=${encodeURIComponent(question)}&mode=Friendly`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            AI Resume Analyzer
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Upload your PDF resume to extract skills, detect curriculum gaps, and practice resume-specific interview questions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="btn-primary cursor-pointer inline-flex items-center gap-2">
            <UploadCloud size={16} />
            <span>Upload New PDF</span>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="sr-only"
            />
          </label>
        </div>
      </div>

      {uploadError && (
        <div className="flex items-center gap-2 rounded-xl border border-rose/30 bg-rose-soft px-4 py-3 text-sm font-semibold text-rose">
          <AlertCircle size={18} /> {uploadError}
        </div>
      )}

      {/* Parsing Loader */}
      {isUploading && (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-surface p-12 text-center shadow-panel">
          <RefreshCw size={36} className="animate-spin text-signal" />
          <h3 className="mt-4 font-display text-lg font-bold text-ink">Analyzing Resume Structure & Projects...</h3>
          <p className="mt-1 text-sm text-ink-soft">
            Extracting candidate credentials, technologies, and generating targeted interview questions.
          </p>
        </div>
      )}

      {!isUploading && (
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
                  <p className="text-xs text-ink-soft">{resume.fileSize} · Uploaded {resume.uploadDate}</p>
                  <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-jade">
                    <CheckCircle2 size={12} /> Parsed & Indexed
                  </span>
                </div>
              </div>
            </div>

            {/* ATS Score */}
            <div className="rounded-xl bg-surface p-5 shadow-panel">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">ATS Fit Score</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="font-display text-3xl font-bold text-ink">{resume.atsScore}%</span>
                    <span className="text-xs font-semibold text-jade">Strong Match</span>
                  </div>
                  <p className="mt-0.5 text-xs text-ink-soft">for {resume.targetRole}</p>
                </div>
                <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-signal-soft">
                  <span className="font-display text-sm font-bold text-signal-deep">{resume.atsScore}</span>
                </div>
              </div>
            </div>

            {/* Placement Quick Action */}
            <div className="flex flex-col justify-between rounded-xl bg-navy-900 p-5 text-white shadow-panel">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-signal-soft">Customized Prep</p>
                <p className="mt-1 text-sm font-semibold">{resume.suggestedQuestions.length} Resume Questions Generated</p>
              </div>
              <button
                onClick={() => setActiveTab('questions')}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-signal-soft hover:text-white"
              >
                View Generated Questions <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-line">
            <button
              onClick={() => setActiveTab('extracted')}
              className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
                activeTab === 'extracted'
                  ? 'border-signal text-signal'
                  : 'border-transparent text-ink-soft hover:text-ink'
              }`}
            >
              Extracted Profile & Projects
            </button>
            <button
              onClick={() => setActiveTab('gaps')}
              className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
                activeTab === 'gaps'
                  ? 'border-signal text-signal'
                  : 'border-transparent text-ink-soft hover:text-ink'
              }`}
            >
              Target Role Skill Gaps ({resume.missingSkills.length})
            </button>
            <button
              onClick={() => setActiveTab('questions')}
              className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
                activeTab === 'questions'
                  ? 'border-signal text-signal'
                  : 'border-transparent text-ink-soft hover:text-ink'
              }`}
            >
              Resume Interview Questions ({resume.suggestedQuestions.length})
            </button>
          </div>

          {/* Tab 1: Extracted Content */}
          {activeTab === 'extracted' && (
            <div className="space-y-6">
              {/* Skills parsed */}
              <Panel title="Identified Skills & Technologies">
                <div className="flex flex-wrap gap-2">
                  {resume.extracted.skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-paper px-3 py-1.5 text-xs font-semibold text-ink shadow-sm"
                    >
                      <Code2 size={13} className="text-signal" /> {skill}
                    </span>
                  ))}
                </div>
              </Panel>

              {/* Projects parsed */}
              <Panel title="Extracted Projects">
                <div className="space-y-4">
                  {resume.extracted.projects.map((proj, idx) => (
                    <div key={idx} className="rounded-xl border border-line bg-paper/50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="font-display text-sm font-bold text-ink">{proj.name}</h4>
                        <span className="rounded-md bg-signal-soft px-2.5 py-0.5 text-xs font-semibold text-signal-deep">
                          {proj.tech}
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-ink-soft">{proj.description}</p>
                    </div>
                  ))}
                </div>
              </Panel>

              {/* Work Experience */}
              <Panel title="Internship & Experience">
                <div className="space-y-4">
                  {resume.extracted.experience.map((exp, idx) => (
                    <div key={idx} className="rounded-xl border border-line bg-paper/50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Briefcase size={16} className="text-signal" />
                          <h4 className="font-display text-sm font-bold text-ink">{exp.role} · {exp.company}</h4>
                        </div>
                        <span className="text-xs text-ink-faint">{exp.period} · {exp.location}</span>
                      </div>
                      <ul className="mt-2.5 list-disc space-y-1 pl-5 text-xs text-ink-soft">
                        {exp.points.map((pt, pIdx) => (
                          <li key={pIdx}>{pt}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </Panel>

              {/* Education */}
              <Panel title="Academic History">
                <div className="grid gap-3 sm:grid-cols-2">
                  {resume.extracted.education.map((edu, idx) => (
                    <div key={idx} className="flex items-start gap-3 rounded-xl border border-line p-4">
                      <GraduationCap size={20} className="mt-0.5 text-signal" />
                      <div>
                        <p className="text-sm font-bold text-ink">{edu.institution}</p>
                        <p className="text-xs text-ink-soft">{edu.degree}</p>
                        <p className="mt-1 text-xs font-semibold text-signal-deep">{edu.grade} · {edu.period}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          )}

          {/* Tab 2: Skill Gaps */}
          {activeTab === 'gaps' && (
            <div className="space-y-4">
              <div className="rounded-xl bg-signal-soft/50 p-4 text-xs text-signal-deep">
                <p className="font-semibold">Benchmarked against 450+ Campus Placements for {resume.targetRole}:</p>
                <p className="mt-0.5 text-ink-soft">
                  Adding these capabilities or building small proof-of-concept projects will significantly improve shortlisting rates.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {resume.missingSkills.map((gap, idx) => (
                  <div key={idx} className="flex flex-col justify-between rounded-xl bg-surface p-5 shadow-panel">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                          gap.importance === 'High' ? 'bg-rose-soft text-rose' : 'bg-saffron-soft text-saffron'
                        }`}>
                          {gap.importance} Priority
                        </span>
                        <BookOpen size={16} className="text-ink-faint" />
                      </div>
                      <h4 className="mt-2 font-display text-base font-bold text-ink">{gap.skill}</h4>
                      <p className="mt-1 text-xs leading-relaxed text-ink-soft">{gap.reason}</p>
                    </div>

                    <a
                      href="/recommendations"
                      className="btn-outline mt-4 inline-flex items-center justify-center gap-1 text-xs"
                    >
                      Add to Study Plan <ArrowRight size={13} />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Resume Questions */}
          {activeTab === 'questions' && (
            <div className="space-y-4">
              <div className="rounded-xl bg-navy-900 p-5 text-white">
                <div className="flex items-center gap-2 text-signal-soft">
                  <Sparkles size={18} />
                  <h3 className="font-display text-sm font-bold">Interviewer Perspective</h3>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-white/70">
                  During technical screenings, interviewers pull questions directly from your claimed projects and internship metrics. Click <strong>"Practice in Live Room"</strong> to run a simulated answer session with instant AI grading.
                </p>
              </div>

              <div className="grid gap-4">
                {resume.suggestedQuestions.map((q, idx) => (
                  <div key={idx} className="flex flex-col justify-between gap-4 rounded-xl bg-surface p-5 shadow-panel sm:flex-row sm:items-center">
                    <div className="space-y-1">
                      <span className="inline-block rounded-md bg-signal-soft px-2.5 py-0.5 text-xs font-semibold text-signal-deep">
                        {q.category}
                      </span>
                      <p className="font-display text-sm font-semibold text-ink sm:text-base">
                        "{q.question}"
                      </p>
                    </div>

                    <button
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
