/* Portfolio AI Assistant — add your Gemini key below before deploying. */
const GEMINI_API_KEY ="AQ.Ab8RN6LphKL8Gg7Vt8IS6BoE-3FlqBT7yOP_pCDZa3cMTS-Hng";
// Gemini 2.0 Flash was shut down in June 2026; use the current stable Flash model.
const GEMINI_MODEL = "gemini-3.5-flash";
const AI_STORAGE_KEY = "abhijeet-portfolio-ai-history";
const PORTFOLIO_CONTEXT = `You are the portfolio assistant for Abhijeet Gajadhane, a Software Developer. Keep answers helpful, accurate, concise, and friendly. Prioritize his portfolio.

Name: Abhijeet Gajadhane
Role: Software Developer
Skills: HTML, CSS, JavaScript, Bootstrap, Tailwind CSS, React.js, Node.js, Express.js, MongoDB, Git, GitHub, REST APIs.
Projects: Grampanchayat Portal; Questionnaire Management System; Portfolio Website.
Education: B.Tech Computer Engineering.
Contact: gajadhanetathaget@gmail.com, +91 94226 47642, GitHub: github.com/Abhijeet1234567890, LinkedIn: linkedin.com/in/abhijeet-gajadhane-0b19a42b2.
For questions outside the portfolio domain, answer normally but still be helpful. Use simple Markdown where it improves readability. Do not invent missing project details.`;

(() => {
  const root = document.querySelector('.portfolio-ai');
  if (!root) return;
  const ui = { launcher: document.getElementById('portfolio-ai-launcher'), panel: document.getElementById('portfolio-ai-panel'), close: document.getElementById('portfolio-ai-close'), clear: document.getElementById('portfolio-ai-clear'), messages: document.getElementById('portfolio-ai-messages'), suggestions: document.getElementById('portfolio-ai-suggestions'), form: document.getElementById('portfolio-ai-form'), input: document.getElementById('portfolio-ai-input'), send: document.getElementById('portfolio-ai-send') };
  let history = loadHistory(); let waiting = false;

  function loadHistory() { try { const saved = JSON.parse(localStorage.getItem(AI_STORAGE_KEY)); return Array.isArray(saved) ? saved.slice(-20) : []; } catch { return []; } }
  function saveHistory() { localStorage.setItem(AI_STORAGE_KEY, JSON.stringify(history.slice(-20))); }
  function scrollToLatest() { requestAnimationFrame(() => { ui.messages.scrollTop = ui.messages.scrollHeight; }); }
  function escapeHtml(value) { const div = document.createElement('div'); div.textContent = value; return div.innerHTML; }
  function renderMarkdown(text) { let html = escapeHtml(text); html = html.replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/^### (.*)$/gm, '<strong>$1</strong>').replace(/^[-*] (.*)$/gm, '<li>$1</li>').replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>').replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br>'); return `<p>${html}</p>`; }
  function addMessage(role, text, shouldStore = false) { const message = document.createElement('div'); message.className = `portfolio-ai__message portfolio-ai__message--${role}`; const bubble = document.createElement('div'); bubble.className = 'portfolio-ai__bubble'; bubble.innerHTML = role === 'assistant' ? renderMarkdown(text) : escapeHtml(text); message.appendChild(bubble); if (role === 'assistant') { const copy = document.createElement('button'); copy.className = 'portfolio-ai__copy'; copy.type = 'button'; copy.textContent = 'Copy'; copy.addEventListener('click', async () => { try { await navigator.clipboard.writeText(text); copy.textContent = 'Copied'; setTimeout(() => copy.textContent = 'Copy', 1200); } catch { copy.textContent = 'Unable to copy'; } }); bubble.appendChild(copy); } ui.messages.appendChild(message); if (shouldStore) { history.push({ role, text }); saveHistory(); } scrollToLatest(); }
  function renderHistory() { ui.messages.innerHTML = ''; if (history.length) history.forEach(item => addMessage(item.role, item.text)); else addMessage('assistant', "Hi! I’m Abhijeet’s portfolio assistant. Ask me about his skills, projects, experience, or how to get in touch."); }
  function setOpen(open) { root.classList.toggle('is-open', open); ui.launcher.setAttribute('aria-expanded', String(open)); ui.panel.setAttribute('aria-hidden', String(!open)); if (open) { renderHistory(); setTimeout(() => ui.input.focus(), 180); } }
  function setWaiting(value) { waiting = value; ui.send.disabled = value; ui.input.disabled = value; }
  function showTyping() { const el = document.createElement('div'); el.className = 'portfolio-ai__message portfolio-ai__message--assistant'; el.id = 'portfolio-ai-typing'; el.innerHTML = '<div class="portfolio-ai__bubble"><span class="portfolio-ai__typing" aria-label="Assistant is typing"><i></i><i></i><i></i></span></div>'; ui.messages.appendChild(el); scrollToLatest(); }
  function hideTyping() { document.getElementById('portfolio-ai-typing')?.remove(); }
  async function requestGemini() { if (!GEMINI_API_KEY.trim()) throw new Error('API_KEY_MISSING'); const contents = history.filter(item => item.role === 'user' || item.role === 'assistant').slice(-12).map(item => ({ role: item.role === 'assistant' ? 'model' : 'user', parts: [{ text: item.text }] })); const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY }, body: JSON.stringify({ systemInstruction: { parts: [{ text: PORTFOLIO_CONTEXT }] }, contents, generationConfig: { temperature: .6, maxOutputTokens: 600 } }) }); const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.error?.message || `Request failed (${response.status})`); const answer = data.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('').trim(); if (!answer) throw new Error('The model returned no text. Please try again.'); return answer; }
  async function sendMessage(text = ui.input.value.trim()) { if (!text || waiting) return; ui.input.value = ''; ui.suggestions.hidden = true; addMessage('user', text, true); setWaiting(true); showTyping(); try { const answer = await requestGemini(); hideTyping(); addMessage('assistant', answer, true); } catch (error) { hideTyping(); const message = error.message === 'API_KEY_MISSING' ? 'The assistant needs a Gemini API key before it can respond. Add your key to `GEMINI_API_KEY` in ai.js and try again.' : `Gemini request failed: ${error.message}`; addMessage('assistant', message); console.error('Portfolio AI error:', error); } finally { setWaiting(false); ui.input.focus(); } }
  ui.launcher.addEventListener('click', () => setOpen(true)); ui.close.addEventListener('click', () => setOpen(false)); ui.form.addEventListener('submit', event => { event.preventDefault(); sendMessage(); }); ui.suggestions.addEventListener('click', event => { if (event.target.matches('button')) sendMessage(event.target.textContent); }); ui.clear.addEventListener('click', () => { history = []; localStorage.removeItem(AI_STORAGE_KEY); ui.suggestions.hidden = false; renderHistory(); }); document.addEventListener('keydown', event => { if (event.key === 'Escape' && root.classList.contains('is-open')) setOpen(false); });
})();
