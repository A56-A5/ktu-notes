// Shared builders for the lab courses (Networks Lab, Data Analytics Lab).
// Experiment content lives in lib/notes-netlab.js and lib/notes-dalab.js.

const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const para = (s) => `<p>${esc(String(s).trim())}</p>`;

const codeBlock = (src, lang = 'plaintext') =>
  `<pre><code class="language-${lang}">${esc(String(src).replace(/^\n+|\s+$/g, ''))}</code></pre>`;

export function expTitle(exp) {
  return `Experiment ${exp.no} - ${exp.title}`;
}

// Aim / theory / algorithm / code / terminal commands, as one editable note.
export function experimentHtml(exp) {
  const heads = [];
  heads.push(`<h1>Experiment ${exp.no} - ${esc(exp.title)}</h1>`);
  if (exp.aim) heads.push(`<h2>Aim</h2>${para(exp.aim)}`);
  if (exp.theory) heads.push(`<h2>Theory</h2>${para(exp.theory)}`);
  if (exp.algorithm?.length) {
    heads.push('<h2>Algorithm</h2>');
    const groups = Array.isArray(exp.algorithm[0])
      ? exp.algorithm
      : [{ label: '', steps: exp.algorithm }];
    for (const g of groups) {
      const steps = Array.isArray(g) ? g : g.steps || [];
      if (g.label) heads.push(`<h3>${esc(g.label)}</h3>`);
      // The manual numbers its own steps; the <ol> supplies the numbering.
      const clean = steps.map((s) => String(s).replace(/^\s*step\s*\d+\s*[:.)-]?\s*/i, ''));
      heads.push(`<ol>${clean.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>`);
    }
  }
  if (exp.code?.length) {
    heads.push('<h2>Code</h2>');
    for (const f of exp.code) {
      if (exp.code.length > 1 || f.file) heads.push(`<h3>${esc(f.file || 'program')}</h3>`);
      heads.push(codeBlock(f.src, f.lang || 'plaintext'));
    }
  }
  if (exp.run) {
    heads.push('<h2>Terminal commands</h2>');
    heads.push(codeBlock(exp.run, 'bash'));
  }
  if (exp.output) heads.push(`<h2>Sample output</h2>${para(exp.output)}`);
  if (exp.result) heads.push(`<h2>Result</h2>${para(exp.result)}`);
  return heads.join('\n');
}

// Course front page for a lab: manual header, objectives, COs, the experiment
// list and how the record is assessed.
export function labSyllabusHtml(def, experiments) {
  const rows = experiments
    .map((e) => `<tr><td>${e.no}</td><td>${esc(e.title)}</td></tr>`)
    .join('');
  const list = (title, items) =>
    items?.length
      ? `<h2>${title}</h2><ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`
      : '';
  const cos = def.outcomes?.length
    ? `<h2>Course Outcomes</h2><table><thead><tr><th>CO</th><th>Course Outcome</th></tr></thead><tbody>${def.outcomes
        .map((o) => `<tr><td>${esc(o.code)}</td><td>${esc(o.text)}</td></tr>`)
        .join('')}</tbody></table>`
    : '';
  return `<h1>${esc(def.title)} <code>${esc(def.code)}</code></h1>
<blockquote><p><strong>KTU ${def.scheme || '2024 Scheme'} · Semester ${def.semester || 5} · ${esc(
    def.courseType || 'Lab'
  )} · ${def.credits} credits · ${esc(def.contactHours)}</strong> Laboratory manual for the course. Everything in this note is editable.</p></blockquote>
<h2>Course details</h2>
<table><tbody>
<tr><th>Course code</th><td>${esc(def.code)}</td></tr>
<tr><th>Credits</th><td>${def.credits}</td></tr>
<tr><th>Teaching hours (L:T:P:R)</th><td>${esc(def.contactHours)}</td></tr>
<tr><th>CIE / ESE marks</th><td>${esc(def.marks || '')}</td></tr>
<tr><th>Exam duration</th><td>${esc(def.examDuration || '')}</td></tr>
<tr><th>Prerequisites</th><td>${esc(def.prerequisites || '')}</td></tr>
</tbody></table>
${list('Course Objectives', def.objectives)}
${cos}
<h2>List of Experiments</h2>
<table><thead><tr><th>No.</th><th>Name of experiment</th></tr></thead><tbody>${rows}</tbody></table>
${list('Assessment', def.assessment)}
${list('Software requirements', def.software)}
${list('Reference books', def.references)}
<p><em>Open any experiment below for its aim, algorithm, code and the terminal commands to run it.</em></p>`;
}
