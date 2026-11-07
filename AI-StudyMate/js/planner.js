(() => {
  const STORAGE_KEY = "studymate_tasks_v1";
  const $ = (id) => document.getElementById(id);
  let tasks = [];
  try { tasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); if (!Array.isArray(tasks)) tasks = []; } catch { tasks = []; }
  const save = () => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); } catch { /* local storage may be disabled */ } };
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));

  function render() {
    const list = $("taskList");
    if (!list) return;
    const completed = tasks.filter(task => task.completed).length;
    const percent = tasks.length ? Math.round(completed / tasks.length * 100) : 0;
    $("taskSummary").textContent = tasks.length ? `${completed} of ${tasks.length} tasks completed` : "A fresh start begins with one task.";
    $("progressLabel").textContent = `${percent}%`;
    $("taskProgressBar").style.width = `${percent}%`;
    if (!tasks.length) {
      list.innerHTML = '<div class="empty-state"><span>✧</span><strong>No tasks yet</strong><p>Add your first study task to get started.</p></div>';
      return;
    }
    list.innerHTML = tasks.map(task => `<div class="task-item ${task.completed ? "completed" : ""}">
      <input class="task-check" type="checkbox" data-task-check="${task.id}" ${task.completed ? "checked" : ""} aria-label="Mark ${escapeHtml(task.title)} completed" />
      <div class="task-details"><strong>${escapeHtml(task.title)}</strong><small>${task.subject ? escapeHtml(task.subject) : "Study task"}${task.dueDate ? ` · Due ${escapeHtml(task.dueDate)}` : ""}</small></div>
      <button class="task-delete" data-task-delete="${task.id}" aria-label="Delete task">×</button>
    </div>`).join("");
  }

  document.addEventListener("submit", (event) => {
    if (event.target.id !== "taskForm") return;
    event.preventDefault();
    const title = $("taskTitle").value.trim();
    if (!title) return;
    tasks.unshift({ id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, title, subject: $("taskSubject").value.trim(), dueDate: $("taskDate").value, completed: false });
    save(); render(); event.target.reset();
    if (window.showToast) window.showToast("Study task added!");
  });
  document.addEventListener("change", (event) => {
    const id = event.target.dataset.taskCheck;
    if (!id) return;
    const task = tasks.find(item => item.id === id);
    if (task) { task.completed = event.target.checked; save(); render(); }
  });
  document.addEventListener("click", (event) => {
    const deleteId = event.target.dataset.taskDelete;
    if (deleteId) { tasks = tasks.filter(task => task.id !== deleteId); save(); render(); }
    if (event.target.id === "clearCompleted") { tasks = tasks.filter(task => !task.completed); save(); render(); if (window.showToast) window.showToast("Completed tasks cleared."); }
  });
  render();
})();
