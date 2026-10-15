import { marked } from 'marked';
import DOMPurify from 'dompurify';

const chat = document.getElementById('chat') as HTMLElement;
const form = document.getElementById('form') as HTMLFormElement;
const input = document.getElementById('input') as HTMLTextAreaElement;

interface Message { role: 'user' | 'assistant'; content: string; }

const SYSTEM_PROMPT = `Pense passo a passo, 
mas registre apenas um esboço mínimo para cada etapa 
do raciocínio, com no máximo 5 palavras. 
Apresente a resposta ao final, após um separador ----.

Diretrizes:
    Escreva em markdown
    Limite cada etapa a 5 palavras criando uma bullet list das etapas
    Foque nos cálculos/transformações essenciais
    Mantenha a progressão lógica
    Indique a resposta final com ----
`;

const MODEL = import.meta.env.VITE_MODEL || 'gemma3';

marked.use({ gfm: true, breaks: true });

function renderMarkdown(target: HTMLElement, text: string) {
  const html = marked.parse(text, { async: false });
  target.innerHTML = DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
}

function createScheduler(render: () => void) {
  let queued = false;
  return () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      render();
    });
  };
}

function appendMessage(role: 'user' | 'assistant', content: string) {
  const bubble = document.createElement('div');
  bubble.className = `max-w-3xl mx-auto rounded-2xl px-5 py-4 shadow-sm ${
    role === 'user' ? 'bg-emerald-600/10 border border-emerald-500/20 text-emerald-50' : 'bg-slate-800/60 border border-slate-700/50 text-slate-100'
  }`;
  bubble.innerHTML = `<div class="font-semibold text-xs uppercase tracking-wider mb-1 opacity-60">${role}</div><div class="markdown"></div>`;
  renderMarkdown(bubble.querySelector('.markdown') as HTMLElement, content);
  chat.appendChild(bubble);
  chat.scrollTop = chat.scrollHeight;
}

async function streamResponse(prompt: string) {
  const messages: Message[] = [{ role: 'user', content: prompt }];
  appendMessage('user', prompt);
  input.value = '';

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages], model: MODEL })
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      appendMessage('assistant', `Erro ${res.status} do backend. ${detail}`.trim());
      return;
    }

    if (!res.body) {
      appendMessage('assistant', 'Erro: sem resposta do backend.');
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let fullText = '';

    const assistantBubble = document.createElement('div');
    assistantBubble.className = 'max-w-3xl mx-auto rounded-2xl px-5 py-4 shadow-sm bg-slate-800/60 border border-slate-700/50 text-slate-100';
    assistantBubble.innerHTML = `<div class="font-semibold text-xs uppercase tracking-wider mb-1 opacity-60">assistant</div><div class="markdown"></div>`;
    chat.appendChild(assistantBubble);

    const streamTextEl = assistantBubble.querySelector('.markdown') as HTMLElement;
    const paint = createScheduler(() => {
      renderMarkdown(streamTextEl, fullText);
      chat.scrollTop = chat.scrollHeight;
    });

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        const trimmed = line.replace(/^data:\s*/, '').trim();
        if (!trimmed || trimmed === '[DONE]') continue;
        try {
          const json = JSON.parse(trimmed);
          if (json.message && json.message.content) {
            fullText += json.message.content;
            paint();
          }
        } catch (e) {}
      }
    }
    renderMarkdown(streamTextEl, fullText);
  } catch (err) {
    console.error(err);
    appendMessage('assistant', 'Erro ao conectar ao backend.');
  }
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const prompt = input.value.trim();
  if (!prompt) return;
  streamResponse(prompt);
});

input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    form.dispatchEvent(new Event('submit'));
  }
});
