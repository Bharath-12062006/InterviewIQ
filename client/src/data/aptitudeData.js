import { APTITUDE_SECTIONS, ONLINE_TESTS } from './aptitudeCatalog.js';
import { GENERAL_AND_VERBAL_QUESTIONS } from './aptitudeGeneralData.js';
import { TECH_AND_PUZZLE_QUESTIONS } from './aptitudeTechData.js';

const STORAGE_KEY = 'interviewiq_aptitude_progress';

export const ALL_QUESTIONS_BY_CONCEPT = {
  ...GENERAL_AND_VERBAL_QUESTIONS,
  ...TECH_AND_PUZZLE_QUESTIONS,
};

export function getQuestionsForConcept(conceptId) {
  return ALL_QUESTIONS_BY_CONCEPT[conceptId] || [];
}

export function getAllConceptsList() {
  const list = [];
  for (const section of APTITUDE_SECTIONS) {
    for (const group of section.groups) {
      for (const concept of group.concepts) {
        list.push({ section, group, concept });
      }
    }
  }
  return list;
}

export function buildOnlineTestQuestions(testId) {
  const test = ONLINE_TESTS.find((t) => t.id === testId) || ONLINE_TESTS[0];
  const pool = [];

  for (const section of APTITUDE_SECTIONS) {
    if (!test.sections.includes(section.id)) continue;
    for (const group of section.groups) {
      for (const concept of group.concepts) {
        const qs = getQuestionsForConcept(concept.id);
        qs.forEach((q) => {
          pool.push({
            ...q,
            conceptId: concept.id,
            conceptName: concept.name,
            sectionId: section.id,
            sectionTitle: section.shortTitle,
          });
        });
      }
    }
  }

  // Deterministic spread across sections, capped at test.questionCount
  const selected = [];
  const step = Math.max(1, Math.floor(pool.length / test.questionCount));
  for (let i = 0; i < pool.length && selected.length < test.questionCount; i += step) {
    selected.push(pool[i]);
  }
  for (let i = 0; i < pool.length && selected.length < test.questionCount; i += 1) {
    if (!selected.includes(pool[i])) {
      selected.push(pool[i]);
    }
  }
  return { test, questions: selected };
}

export function getAptitudeProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        answers: parsed.answers || {},
        tests: parsed.tests || [],
      };
    }
  } catch {}
  return { answers: {}, tests: [] };
}

export function saveAptitudeAnswer(questionId, selectedIndex, isCorrect) {
  const current = getAptitudeProgress();
  const updated = {
    ...current,
    answers: {
      ...current.answers,
      [questionId]: { selectedIndex, isCorrect, updatedAt: Date.now() },
    },
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}
  return updated;
}

export function saveOnlineTestResult(result) {
  const current = getAptitudeProgress();
  const updated = {
    ...current,
    tests: [result, ...current.tests].slice(0, 20),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}
  return updated;
}
