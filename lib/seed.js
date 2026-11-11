import {
  DATA_MINING,
  COMPUTER_NETWORKS,
  SEMESTER,
  SCHEME,
  EXAM_SCHEDULE,
  examFor,
  formatExamDate,
  formatExamDay,
} from './syllabus';
import { DAA, DATA_ANALYTICS, BIG_DATA } from './syllabus-more';
import { LAB_DEFS } from './syllabus-labs';
import { expTitle, experimentHtml, labSyllabusHtml } from './lab';
import { NETWORKS_LAB_EXPERIMENTS } from './notes-netlab';
import { DATA_ANALYTICS_LAB_EXPERIMENTS } from './notes-dalab';
import { uid } from './tree';
import DM_MODULES from './data/dm-modules.json';
import { CN_NOTES } from './notes-cn';
import { DAA_NOTES } from './notes-daa';
import { DA_NOTES } from './notes-da';
import { BD_NOTES } from './notes-bd';

// Full module trees (module > topic > note) used instead of the syllabus
// topic scaffold for subjects that ship ready-made study modules.
// Bumped when the shipped module libraries change in a way that should
// replace the copy already saved in a browser.
export const LIBRARY_VERSION = 4;

export const MODULE_LIBRARY = {
  'data-mining': DM_MODULES.modules,
};

// Experiment bodies for the lab courses, keyed by the note title used in the
// tree, so an empty lab note is refilled on load exactly like a study note.
const labLibrary = (defs, experiments) => {
  const out = {};
  for (const def of defs) {
    const list = def.key === 'networks-lab' ? experiments[0] : experiments[1];
    for (const exp of list) out[expTitle(exp)] = experimentHtml(exp);
  }
  return out;
};

const LAB_LIBRARY = labLibrary(LAB_DEFS, [
  NETWORKS_LAB_EXPERIMENTS,
  DATA_ANALYTICS_LAB_EXPERIMENTS,
]);

// Study-note bodies written for this notebook, keyed by the exact subtopic
// titles used in the syllabus. Subtopics without a library entry keep their
// inline (usually empty) body.
export const NOTE_LIBRARY = {
  'computer-networks': CN_NOTES,
  'daa': DAA_NOTES,
  'data-analytics': DA_NOTES,
  'big-data': BD_NOTES,
  'networks-lab': LAB_LIBRARY['networks-lab'],
  'data-analytics-lab': LAB_LIBRARY['data-analytics-lab'],
};

export const SEMESTER_ID = 'sem-ktu-2024-s5';
export const PROJECT = 'KTU B.Tech CSE';

// Data Mining first (priority content), then Networks and the rest; the two
// lab courses come last.
export const SUBJECT_DEFS = [
  DATA_MINING,
  COMPUTER_NETWORKS,
  DAA,
  DATA_ANALYTICS,
  BIG_DATA,
  ...LAB_DEFS,
];

const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function syllabusHtml(def) {
  const modules = def.modules
    .map((m, i) => {
      // Topic / subtopic outline, exactly as printed in the syllabus.
      const topics = (m.topics || [])
        .map((t) => {
          const subs = (t.subs || []).filter((s) => s && s.title);
          if (!subs.length) return `<li>${esc(t.title)}</li>`;
          return `<li>${esc(t.title)}<ul>${subs
            .map((s) => `<li>${esc(s.title)}</li>`)
            .join('')}</ul></li>`;
        })
        .join('');
      return `<h2>Module ${i + 1} - ${esc(m.title)}</h2><p><em>${
        m.hours
      } contact hours</em></p><p>${esc(m.description)}</p>${topics ? `<ul>${topics}</ul>` : ''}`;
    })
    .join('');
  const outcomes = def.outcomes?.length
    ? `<h2>Course Outcomes</h2><ul>${def.outcomes.map((o) => `<li>${esc(o)}</li>`).join('')}</ul>`
    : '';
  const books = def.textbooks?.length
    ? `<h2>Text Books</h2><ul>${def.textbooks.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>`
    : '';
  const refs = def.references?.length
    ? `<h2>Reference Books</h2><ul>${def.references.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>`
    : '';
  return `<h1>${esc(def.title)} <code>${esc(def.code)}</code></h1>
<blockquote><p><strong>Official KTU ${SCHEME}, Semester ${SEMESTER} - B.Tech Computer Science and Engineering.</strong> This summary is reproduced from the published curriculum. Module numbering and topic wording are preserved. Everything in this app is editable, including this note.</p></blockquote>
<h2>Course Objectives</h2><ul>${(def.objectives || []).map((o) => `<li>${esc(o)}</li>`).join('')}</ul>
${modules}${outcomes}${books}${refs}
<h2>Verification</h2>
<p>Source: KTU B.Tech Curriculum 2024 (CSE / CSE-Data Science, Semester 5). ${
    def.note ? esc(def.note) : 'Contact hours and module descriptions match the published syllabus.'
  }</p>
<p><em>Official syllabus content is kept separate from your personal notes. You may edit, annotate or delete any part of it.</em></p>`;
}

function buildSubject(def, index, semesterId) {
  const now = Date.now();
  const base = {
    source: 'official',
    createdAt: now,
    modified: now,
  };
  const sid = `sub-${def.key}`;
  const library = NOTE_LIBRARY[def.key];

  // Lab courses: subject > syllabus note > one note per experiment.
  if (def.lab) {
    const experiments =
      def.key === 'networks-lab' ? NETWORKS_LAB_EXPERIMENTS : DATA_ANALYTICS_LAB_EXPERIMENTS;
    const nodes = [
      {
        ...base,
        id: sid,
        parentId: semesterId,
        type: 'subject',
        title: def.title,
        code: def.code,
        description: def.description,
        order: index,
        credits: def.credits,
        contactHours: def.contactHours,
        progress: 0,
      },
      {
        ...base,
        id: `${def.key}-syllabus`,
        parentId: sid,
        type: 'note',
        title: 'Syllabus',
        order: 0,
        body: labSyllabusHtml(def, experiments),
        category: 'syllabus',
        description: `Official ${def.code} lab manual`,
      },
    ];
    experiments.forEach((exp) => {
      nodes.push({
        ...base,
        id: `${def.key}-e${exp.no}`,
        parentId: sid,
        type: 'note',
        title: expTitle(exp),
        order: exp.no,
        body: experimentHtml(exp),
        source: 'official',
        category: 'experiment',
        description: exp.aim,
      });
    });
    return nodes;
  }

  const nodes = [
    {
      ...base,
      id: sid,
      parentId: semesterId,
      type: 'subject',
      title: def.title,
      code: def.code,
      description: def.description,
      order: index,
      credits: def.credits,
      contactHours: def.contactHours,
      progress: 0,
      ...(examFor(def.code)
        ? {
            examDate: examFor(def.code).date,
            examSlot: examFor(def.code).slot,
            examPaperCode: examFor(def.code).paperCode,
          }
        : {}),
      libraryVersion: MODULE_LIBRARY[def.key] ? LIBRARY_VERSION : undefined,
    },
    {
      ...base,
      id: `${def.key}-syllabus`,
      parentId: sid,
      type: 'note',
      title: 'Syllabus',
      order: 0,
      body: syllabusHtml(def),
      category: 'syllabus',
      description: `Official ${def.code} syllabus`,
    },
  ];

  const modules = MODULE_LIBRARY[def.key];
  if (modules) {
    // Ready-made module notes: module > topic > note, one note body each.
    modules.forEach((mod, mi) => {
      const official = def.modules[mi] || {};
      const mid = `${def.key}-m${mi + 1}`;
      const name = String(mod.title || '').replace(/^Module\s+\d+\s*:\s*/i, '').trim();
      nodes.push({
        ...base,
        id: mid,
        parentId: sid,
        type: 'module',
        title: `Module ${mi + 1}`,
        subtitle: name || official.title || mod.subtitle || '',
        description: official.description || '',
        hours: official.hours,
        order: mi + 1,
        moduleNo: mi + 1,
      });
      (mod.children || []).forEach((topicNode, ti) => {
        const tid = `${mid}-t${ti + 1}`;
        nodes.push({
          ...base,
          id: tid,
          parentId: mid,
          type: 'topic',
          title: topicNode.title,
          order: ti,
          description: '',
        });
        (topicNode.children || []).forEach((noteNode, ni) => {
          nodes.push({
            ...base,
            id: `${tid}-s${ni + 1}`,
            parentId: tid,
            type: 'note',
            title: noteNode.title,
            order: ni,
            body: noteNode.body || '',
            source: 'official',
            category: 'subtopic',
          });
        });
      });
    });
    return nodes;
  }

  def.modules.forEach((mod, mi) => {
    const mid = `${def.key}-m${mi + 1}`;
    nodes.push({
      ...base,
      id: mid,
      parentId: sid,
      type: 'module',
      title: `Module ${mi + 1}`,
      subtitle: mod.title,
      description: mod.description,
      hours: mod.hours,
      order: mi + 1,
      moduleNo: mi + 1,
    });
    mod.topics.forEach((topic, ti) => {
      const tid = `${mid}-t${ti + 1}`;
      nodes.push({
        ...base,
        id: tid,
        parentId: mid,
        type: 'topic',
        title: topic.title,
        order: ti,
        description: '',
      });
      topic.subs.forEach((sub, si) => {
        const body = (library && library[sub.title]) || sub.body || '';
        if (body !== (sub.body || '')) sub.body = ''; // untouched by us below
        nodes.push({
          ...base,
          id: `${tid}-n${si + 1}`,
          parentId: tid,
          type: 'note',
          title: sub.title,
          order: si,
          body,
          source: sub.source || 'official',
          category: 'subtopic',
        });
      });
    });
  });
  return nodes;
}

// Semester 5 end-semester exam timetable, seeded as a normal editable note
// under the semester and kept in sync with EXAM_SCHEDULE when it is missing.
export function examScheduleHtml() {
  const rows = EXAM_SCHEDULE.map(
    (e) =>
      `<tr><td>${esc(e.slot)}</td><td><strong>${esc(e.paperCode)}</strong></td><td>${esc(
        e.title
      )}${e.elective ? ` <em>(${esc(e.elective)})</em>` : ''}</td><td>${esc(
        formatExamDate(e.date)
      )}</td><td>${esc(formatExamDay(e.date))}</td></tr>`
  ).join('');
  return `<h1>Semester ${SEMESTER} Exam Schedule</h1>
<blockquote><p><strong>KTU 2024 Scheme · B.Tech Computer Science and Engineering · Semester ${SEMESTER}</strong> End-semester examination timetable, slots A-E.</p></blockquote>
<table><thead><tr><th>Slot</th><th>Code</th><th>Subject</th><th>Date</th><th>Day</th></tr></thead><tbody>${rows}</tbody></table>
<p><em>This note is editable like any other note. A subject's own exam date always wins over this table.</em></p>`;
}

// Bumped when the generated timetable text changes, so an untouched copy of
// the seeded note is rewritten instead of keeping an old date list.
export const EXAM_SCHEDULE_VERSION = 4;

// FNV-1a of the generated body, stamped on the note so a later timetable
// update can tell "still exactly what we generated" from "the user edited it"
// without relying on createdAt/modified timestamps.
export function seedBodyHash(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16);
}

export function buildExamScheduleNote(semesterId = SEMESTER_ID) {
  const now = Date.now();
  const body = examScheduleHtml();
  return {
    id: `${semesterId}-exams`,
    parentId: semesterId,
    type: 'note',
    title: 'Exam Schedule',
    order: 1,
    source: 'official',
    category: 'exams',
    description: `Semester ${SEMESTER} end-semester examination dates`,
    body,
    seedVersion: EXAM_SCHEDULE_VERSION,
    seedHash: seedBodyHash(body),
    createdAt: now,
    modified: now,
  };
}

export function buildSeed() {
  const now = Date.now();
  const semester = {
    id: SEMESTER_ID,
    parentId: null,
    type: 'semester',
    title: 'Semester 5',
    subtitle: `${PROJECT} · ${SCHEME}`,
    order: 0,
    source: 'official',
    scheme: SCHEME,
    program: PROJECT,
    semesterNo: SEMESTER,
    createdAt: now,
    modified: now,
  };
  const nodes = [semester, buildExamScheduleNote(SEMESTER_ID)];
  SUBJECT_DEFS.forEach((def, i) => nodes.push(...buildSubject(def, i, SEMESTER_ID)));
  return nodes;
}

// Blank subject template used by "Add subject".
export function newSubject({ title, code, description = '', semesterId = SEMESTER_ID, order = 0 }) {
  const id = `sub-${uid('s')}`;
  const now = Date.now();
  return [
    {
      id,
      parentId: semesterId,
      type: 'subject',
      title,
      code,
      description,
      order,
      source: 'personal',
      createdAt: now,
      modified: now,
    },
    {
      id: uid('f'),
      parentId: id,
      type: 'folder',
      title: 'Module 1',
      order: 0,
      source: 'personal',
      createdAt: now,
      modified: now,
    },
  ];
}

export function defaultChildren(parent, type = 'topic') {
  const now = Date.now();
  return {
    id: uid('n'),
    parentId: parent,
    type,
    title: '',
    order: 0,
    source: 'personal',
    createdAt: now,
    modified: now,
  };
}
