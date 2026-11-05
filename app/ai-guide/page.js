import Link from 'next/link';
import { ArrowLeft, Sparkles, Upload, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import CopyButton from '../../components/CopyButton';

const PROMPT = `You are generating content for a personal KTU study-notes app.

TASK
Create one complete, valid JSON file that I can import into the app at the Semester 5 level. The file must describe one subject with its modules, topics, subtopics and real study notes.

OUTPUT FORMAT - return JSON only, no markdown fences, no commentary:
{
  "format": "ktu-notes",
  "version": 1,
  "nodes": [
    {
      "type": "subject",
      "title": "Subject name",
      "code": "COURSE_CODE",
      "description": "One-sentence description.",
      "children": [
        {
          "type": "note",
          "title": "Syllabus",
          "body": "<h2>Official syllabus summary</h2><p>...</p>"
        },
        {
          "type": "module",
          "title": "Module 1",
          "subtitle": "Official module title",
          "hours": 9,
          "children": [
            {
              "type": "topic",
              "title": "Topic from the syllabus",
              "children": [
                {
                  "type": "note",
                  "title": "Subtopic note title",
                  "body": "<p>Actual study notes, not a placeholder.</p><h3>Key points</h3><ul><li>...</li></ul>"
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}

ALLOWED NODE TYPES
semester, subject, folder, module, topic, subtopic, note, resource.
For this request use only: subject, module, topic, note, folder, resource.
- module = a numbered syllabus module (title "Module 1", "Module 2", ...; put the official module name in "subtitle").
- topic = a syllabus topic inside a module.
- note = the actual readable note; subtopics are notes placed inside a topic.
- folder = optional grouping such as "Previous Year Questions" or "Resources".
- resource = optional link/reading note; it behaves like a note.

REQUIRED SHAPE
- Exactly one subject at the top level of "nodes".
- Four modules with titles "Module 1" to "Module 4".
- Each module contains the topics from the official KTU 2024 Scheme syllabus.
- Each topic contains 1 or more note nodes with real content.
- Keep the syllabus separate from personal notes. You may add folders at the end for "Personal Notes", "Previous Year Questions" and "Resources".

NOTE BODY HTML - use only this subset:
<p>, <h2>, <h3>, <ul>, <ol>, <li>, <strong>, <em>, <code>, <pre><code>, <blockquote>, <hr>, <table>, <thead>, <tbody>, <tr>, <th>, <td>, <a href="...">, <br>.
Do not use scripts, styles, classes, iframes or external images.
Inline maths: $E = mc^2$. Display maths: $$ ... $$.
Every paragraph should contain useful, exam-oriented explanation. Use headings, short paragraphs and bullet lists. Do not write "TODO", "content here", "lorem ipsum" or fake facts.

CONTENT QUALITY
- Follow the official KTU 2024 Scheme syllabus for B.Tech CSE Semester 5.
- Do not invent module numbers, topic names or course outcomes. If a detail is uncertain, leave it out rather than invent it.
- Prefer precise definitions, formulas, steps, comparisons and one worked example where useful.
- Write in clear English suitable for revision.

IMAGES
You cannot attach binary images. Do not invent asset ids. If a diagram matters, describe it in a note and I will add the image in the app.

CONSTRAINTS
- Valid JSON, UTF-8, double-quoted keys and strings.
- No comments, no trailing commas, no markdown code fences.
- Optional "id" fields are allowed, but must be unique. I import with fresh ids anyway.
- Escape double quotes inside HTML strings as \\" or use single quotes in attributes. Do not break the JSON.
- Output the finished JSON in one message.

SUBJECT TO GENERATE
Subject: <FILL IN SUBJECT NAME>
Course code: <FILL IN KTU CODE>
Semester: 5
Scheme: 2024
Notes depth: <e.g. concise revision notes, 2-4 short paragraphs per subtopic>
`;

const PROMPT_EXTRA = `You are adding more material to an existing KTU Notes notebook.

TASK
Produce a valid JSON file that I will import into one subject or folder. Do not repeat the subject node - start with modules, topics, notes or folders, because the app adds them inside the folder I choose.

OUTPUT
{
  "format": "ktu-notes",
  "version": 1,
  "nodes": [
    {
      "type": "module",
      "title": "Module 5",
      "subtitle": "Extra module title",
      "children": [
        {
          "type": "topic",
          "title": "Topic name",
          "children": [
            { "type": "note", "title": "Note name", "body": "<p>Real notes...</p>" }
          ]
        }
      ]
    }
  ]
}

RULES
- Allowed types: folder, module, topic, subtopic, note, resource.
- Use real content, not placeholders. Give definitions, formulas, steps, comparisons, examples and revision tips.
- Note bodies use: <p>, <h2>, <h3>, <ul>, <ol>, <li>, <strong>, <em>, <code>, <pre><code>, <blockquote>, <table>, <tr>, <th>, <td>, <a>.
- Inline maths $...$; display maths $$...$$.
- Keep official syllabus wording separate from your own explanations.
- Valid JSON only: no markdown fences, no comments, no trailing commas.
- Optional ids must be unique; avoid images and asset ids.

CONTEXT
Subject: <SUBJECT NAME AND CODE>
Insert into: <module/topic/folder name>
What to generate: <e.g. 10 previous-year questions with answers, or notes for Module 3 topic 2>
Depth: <short revision / detailed>
`;

function Code({ children }) {
  return <pre className="guide-code"><code>{children}</code></pre>;
}

export const metadata = {
  title: 'KTU Notes',
  description: 'A ready-to-copy prompt that makes any AI generate valid KTU Notes JSON.',
};

export default function AiGuidePage() {
  return (
    <main className="shell guide">
      <div className="topbar" style={{ marginBottom: 4 }}>
        <Link href="/" className="btn sm"><ArrowLeft size={13} /> Back to notebook</Link>
        <div className="spacer" />
        <a className="btn sm" href="/example-import.json" download>Download example JSON</a>
      </div>

      <section className="paper hero torn-a" style={{ marginTop: 16 }}>
        <span className="tape" />
        <div className="kicker">For ChatGPT, Claude, Gemini, or any local model</div>
        <h2>Ask an AI for importable notes</h2>
        <p>
          Copy a prompt below, replace the placeholders, and give it to any AI. It will return JSON that this app
          validates and imports. The prompt already contains the file format, allowed HTML, syllabus rules and the
          “no fake content” constraints, so you do not have to explain the app again.
        </p>
        <div className="badges" style={{ marginTop: 12 }}>
          <span className="badge official">JSON only</span>
          <span className="badge">recursive modules &amp; topics</span>
          <span className="badge">TipTap-safe HTML</span>
          <span className="badge">validated before import</span>
        </div>
      </section>

      <section className="paper white torn-c" style={{ marginBottom: 22 }}>
        <div className="section-head" style={{ marginTop: 0 }}>
          <h3><Sparkles size={17} style={{ verticalAlign: -2, marginRight: 5 }} /> Prompt 1 - a whole subject</h3>
          <span className="rule" />
          <CopyButton text={PROMPT} label="Copy prompt" />
        </div>
        <p className="muted" style={{ fontSize: '.88rem' }}>
          Use this when you want a new subject with four modules. Fill in the three placeholders at the bottom before
          sending. Import the result on the home page (it becomes a subject card).
        </p>
        <Code>{PROMPT}</Code>
      </section>

      <section className="paper white torn-d" style={{ marginBottom: 22 }}>
        <div className="section-head" style={{ marginTop: 0 }}>
          <h3>Prompt 2 - add notes to an existing folder</h3>
          <span className="rule" />
          <CopyButton text={PROMPT_EXTRA} label="Copy prompt" />
        </div>
        <p className="muted" style={{ fontSize: '.88rem' }}>
          Use this for extra modules, question banks or revision notes. The file starts with modules/topics/notes, not
          a subject. In the app, open the target subject or folder and use <strong>Import here</strong>.
        </p>
        <Code>{PROMPT_EXTRA}</Code>
      </section>

      <section className="paper yellow torn-b" style={{ marginBottom: 22 }}>
        <h3 className="hand" style={{ fontSize: '1.55rem', margin: '0 0 8px' }}>
          <Upload size={17} style={{ verticalAlign: -2, marginRight: 5 }} /> How to import the answer
        </h3>
        <ol className="guide-steps">
          <li>Ask the AI for the file and wait until it finishes the whole JSON.</li>
          <li>Copy the JSON into a file named <code>subject.json</code>. Remove any markdown fences such as <code>```json</code>.</li>
          <li>In KTU Notes, click <strong>Import</strong> (or <strong>Import here</strong> inside a subject).</li>
          <li>Choose the file. The app validates it, shows the hierarchy and reports errors before writing anything.</li>
          <li>Choose <strong>Merge</strong> unless you intentionally want replace-by-ID. Merge never overwrites your notes.</li>
          <li>After import, open the new notes and add images with the editor.</li>
        </ol>
        <p className="kbd-hint" style={{ marginTop: 12 }}>
          <AlertTriangle size={11} style={{ verticalAlign: -1 }} /> AI content can be wrong. Check formulas and syllabus
          claims against the official KTU document before trusting them.
        </p>
      </section>

      <section className="paper white torn-a" style={{ marginBottom: 22 }}>
        <h3 className="hand" style={{ fontSize: '1.55rem', margin: '0 0 8px' }}>
          <ImageIcon size={17} style={{ verticalAlign: -2, marginRight: 5 }} /> Images and attachments
        </h3>
        <p>
          JSON cannot carry binary images. In a note body, images are stored as <code>asset:&lt;id&gt;</code> references,
          and the binary lives in IndexedDB or Supabase Storage. Ask the AI to <em>describe</em> a diagram in a note,
          then add the actual image in the editor (upload, paste or drag/drop). A ZIP export created by this app includes
          the images and can re-link them on import; a plain JSON export cannot.
        </p>
      </section>

      <section className="paper white torn-c">
        <h3 className="hand" style={{ fontSize: '1.55rem', margin: '0 0 8px' }}>Format reference</h3>
        <p>
          The complete field list and import rules are in the <Link href="/docs/JSON_SCHEMA.md">JSON schema document</Link>.
          The same rules are enforced by the validator:
        </p>
        <ul className="guide-steps">
          <li><code>format</code> must be <code>&quot;ktu-notes&quot;</code>; <code>version</code> must be <code>1</code>.</li>
          <li>Every node needs a non-empty <code>title</code> and an allowed <code>type</code>.</li>
          <li>Top-level nodes must be subjects when importing at the semester level.</li>
          <li>Nesting can be arbitrarily deep; <code>children</code> is an array and order is preserved.</li>
          <li>Unknown fields are ignored; duplicate ids are reported and resolved safely.</li>
          <li>Note bodies are HTML; plain text is also accepted and rendered.</li>
        </ul>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
          <Link href="/" className="btn primary">Open the notebook</Link>
          <a href="/example-import.json" download className="btn">Download a working example</a>
        </div>
      </section>
    </main>
  );
}
