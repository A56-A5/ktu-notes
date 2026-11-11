'use client';
// Math rendering for note bodies.
//
// The stock @tiptap/extension-mathematics plugin only understands inline
// `$…$` and always renders with displayMode: false, so the `$$ … $$` blocks
// that the study notes and the toolbar's "block equation" button produce were
// shown as raw LaTeX text. This extension renders both:
//
//   inline   $E = mc^2$      or  \(E = mc^2\)
//   display  $$ … $$         or  \[ … \]
//
// Math is kept as plain text in the document (so it stays editable and still
// exports as LaTeX behind the dollar delimiters); KaTeX output is drawn as a
// decoration. Moving the caret into an equation reveals its LaTeX again.
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import katex from 'katex';

// Groups: 1 display ($$ … $$), 2 display (\[ … \]), 3 inline ($ … $),
// 4 inline (\( … \)). Inline content may not start or end with whitespace and
// may not span lines, which keeps ordinary prose such as "costs $5" safe.
const MATH_RE =
  /\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|\$(?!\s)((?:[^$\\\n]|\\.)+?)(?<!\s)\$|\\\(([\s\S]+?)\\\)/g;

// "$5 and $10" must not become math.
const MONEY_RE = /^\d[\d.,]*$/;

// Clicking a rendered equation puts the caret inside its LaTeX source, which
// makes the raw text visible and editable again.
function makeEditable(view, getPos, open) {
  return (event) => {
    event.preventDefault();
    const at = Math.min(getPos() + open, view.state.doc.content.size);
    view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, at)));
    view.focus();
  };
}

function renderMath(latex, display) {
  const host = document.createElement('span');
  host.className = display ? 'math-block' : 'math-inline';
  host.setAttribute('contenteditable', 'false');
  try {
    katex.render(latex, host, { throwOnError: false, displayMode: display, output: 'html' });
  } catch {
    host.textContent = latex;
    return host;
  }
  return host;
}

function findMath(text) {
  const out = [];
  MATH_RE.lastIndex = 0;
  let m;
  while ((m = MATH_RE.exec(text))) {
    const display = m[1] != null || m[2] != null;
    const latex = (m[1] ?? m[2] ?? m[3] ?? m[4] ?? '').trim();
    if (!latex) continue;
    if (!display && (MONEY_RE.test(latex) || !/[\\^_{}=<>+\-*/()a-zA-Z]/.test(latex))) continue;
    // Length of the opening delimiter, so a click can put the caret between
    // the delimiters and the LaTeX instead of inside the delimiter itself.
    const open = display ? 2 : 1;
    out.push({ index: m.index, length: m[0].length, latex, display, open });
  }
  return out;
}

// Static HTML rendering of the same math, for the read-only note view.
// Code spans and pre blocks are skipped so code containing $ is untouched.
export function renderMathHtml(html) {
  if (!html || html.indexOf('$') < 0) return html;
  const parts = String(html).split(/(<pre[\s\S]*?<\/pre>|<code[\s\S]*?<\/code>)/g);
  return parts
    .map((part) => {
      if (part.startsWith('<pre') || part.startsWith('<code')) return part;
      return part.replace(MATH_RE, (m, d1, d2, i1, i2) => {
        const display = d1 != null || d2 != null;
        const latex = (d1 ?? d2 ?? i1 ?? i2 ?? '').trim();
        if (!latex) return m;
        if (!display && (MONEY_RE.test(latex) || !/[\\^_{}=<>+\-*/()a-zA-Z]/.test(latex))) return m;
        let out;
        try {
          out = katex.renderToString(latex, { throwOnError: false, displayMode: display, output: 'html' });
        } catch {
          return m;
        }
        return `<span class="${display ? 'math-block' : 'math-inline'}">${out}</span>`;
      });
    })
    .join('');
}

const MathRender = Extension.create({
  name: 'mathRender',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('mathRender'),
        props: {
          decorations(state) {
            const { from, to } = state.selection;
            const decos = [];
            state.doc.descendants((node, pos) => {
              if (node.type.name === 'codeBlock') return false;
              if (!node.isText || !node.text) return;
              for (const hit of findMath(node.text)) {
                const start = pos + hit.index;
                const end = start + hit.length;
                // Caret or selection touching the equation: keep the raw LaTeX
                // on screen so it can be edited.
                if (from <= end && to >= start) continue;
                decos.push(
                  Decoration.inline(start, end, {
                    class: 'math-source',
                    style: 'display:none',
                  })
                );
                decos.push(
                  Decoration.widget(
                    start,
                    (view, getPos) => {
                      const el = renderMath(hit.latex, hit.display);
                      el.title = 'Click to edit the LaTeX';
                      el.addEventListener('mousedown', makeEditable(view, getPos, hit.open));
                      return el;
                    },
                    { side: 0, ignoreSelection: true }
                  )
                );
              }
            });
            return DecorationSet.create(state.doc, decos);
          },
        },
      }),
    ];
  },
});

export default MathRender;
