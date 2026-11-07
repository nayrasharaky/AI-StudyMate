(() => {
  const $ = (id) => document.getElementById(id);
  let toastTimer;
  window.showToast = (message) => {
    const toast = $("toast"); toast.textContent = message; toast.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
  };
  const labels = { home: "Overview", chat: "AI Study Chat", summary: "Smart Summary", quiz: "Quiz Generator", planner: "Study Planner" };
  function go(view) {
    if (!labels[view]) return;
    document.querySelectorAll(".view").forEach(section => section.classList.toggle("active", section.id === `view-${view}`));
    document.querySelectorAll(".nav-item").forEach(button => button.classList.toggle("active", button.dataset.view === view));
    $("pageCrumb").textContent = labels[view]; $("sidebar").classList.remove("open"); window.scrollTo({ top: 0, behavior: "smooth" });
  }
  document.addEventListener("click", (event) => {
    const goButton = event.target.closest("[data-go]"); if (goButton) go(goButton.dataset.go);
    const nav = event.target.closest("[data-view]"); if (nav) go(nav.dataset.view);
    const prompt = event.target.closest("[data-prompt]"); if (prompt) { go("chat"); $("chatInput").value = prompt.dataset.prompt; $("chatInput").focus(); }
    const copyButton = event.target.closest("[data-copy]"); if (copyButton) {
      const target = $(copyButton.dataset.copy); const text = target?.innerText || "";
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(() => showToast("Copied to clipboard!")).catch(() => showToast("Could not copy automatically. Select the text to copy."));
      else showToast("Select the result text and copy it manually.");
    }
  });
  $("mobileMenu").addEventListener("click", () => $("sidebar").classList.toggle("open"));
  $("themeToggle").addEventListener("click", () => { document.body.classList.toggle("light-theme"); try { localStorage.setItem("studymate_theme", document.body.classList.contains("light-theme") ? "light" : "dark"); } catch {} });
  try { if (localStorage.getItem("studymate_theme") === "light") document.body.classList.add("light-theme"); } catch {}

  const messages = $("chatMessages");
  const safeText = (value) => String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  function addMessage(text, who) {
    const row = document.createElement("div"); row.className = `message ${who === "user" ? "user-message" : "assistant-message"}`;
    row.innerHTML = `<div class="message-avatar">${who === "user" ? "N" : "✦"}</div><div class="message-body"><div class="message-name">${who === "user" ? "You" : "StudyMate AI"}</div><p>${safeText(text)}</p><div class="message-time">${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div></div>`;
    messages.appendChild(row); messages.scrollTop = messages.scrollHeight; return row;
  }
  async function runAI(mode, input, options, button, resultPanel, resultText, defaultLabel) {
    if (!input.trim()) { showToast("Add some study material first."); return; }
    button.disabled = true; button.textContent = "Working..."; resultPanel.classList.add("hidden");
    try { const result = await window.StudyMateAI.askAI(mode, input, options); resultText.textContent = result; resultPanel.classList.remove("hidden"); }
    catch (error) { showToast(error.message || "Something went wrong. Please try again."); }
    finally { button.disabled = false; button.textContent = defaultLabel; }
  }
  $("chatForm").addEventListener("submit", async (event) => {
    event.preventDefault(); const input = $("chatInput"); const prompt = input.value.trim(); if (!prompt) return;
    addMessage(prompt, "user"); input.value = "";
    const thinking = addMessage("Thinking through your question...", "assistant");
    try { const answer = await window.StudyMateAI.askAI("chat", prompt); thinking.querySelector("p").textContent = answer; thinking.querySelector(".message-time").textContent = "Just now"; }
    catch (error) { thinking.querySelector("p").textContent = error.message || "I couldn't reach the AI service. Check your connection and Worker setup."; showToast("AI request failed."); }
    messages.scrollTop = messages.scrollHeight;
  });
  $("clearChat").addEventListener("click", () => { messages.innerHTML = '<div class="message assistant-message"><div class="message-avatar">✦</div><div class="message-body"><div class="message-name">StudyMate AI</div><p>Chat cleared. What would you like to learn about now?</p><div class="message-time">Ready for a new question</div></div></div>'; });
  $("summaryInput").addEventListener("input", (event) => { $("summaryCount").textContent = `${event.target.value.length.toLocaleString()} characters`; });
  $("makeSummary").addEventListener("click", (event) => runAI("summary", $("summaryInput").value, {}, event.currentTarget, $("summaryResult"), $("summaryResultText"), "✦ Generate summary"));
  $("makeQuiz").addEventListener("click", (event) => runAI("quiz", $("quizTopic").value, { count: Number($("quizCount").value), difficulty: $("quizLevel").value }, event.currentTarget, $("quizResult"), $("quizResultText"), "✦ Generate quiz"));
})();
