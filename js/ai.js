(() => {
  const config = window.STUDYMATE_CONFIG || { API_BASE_URL: "" };
  const demoResponses = {
    chat: "This is a demo response because the AI endpoint isn't connected yet.\n\nTo connect a real AI model, deploy the Worker in the worker folder, add your Gemini API key as a Worker secret, and paste the Worker URL into js/config.js. Then reload the page and try again.",
    summary: "DEMO SUMMARY\n\n• Main idea: your notes will be condensed into the most important concepts.\n• Key definitions: important terms and their meanings will be listed.\n• Remember: after connecting the AI endpoint, this section will summarize the actual text you provide.\n\nConnect your Worker URL in js/config.js to enable real AI summaries.",
    quiz: "DEMO QUIZ\n\n1. What is the main idea of the topic?\n   A) Review the notes  B) Ignore key terms  C) Skip examples  D) None of the above\n   Answer: A\n\nThis is only a sample. Connect the AI endpoint to generate questions from your own material."
  };

  async function askAI(mode, input, options = {}) {
    const base = (config.API_BASE_URL || "").trim().replace(/\/$/, "");
    if (!base) return demoResponses[mode] || demoResponses.chat;
    const response = await fetch(`${base}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, input, options })
    });
    let data;
    try { data = await response.json(); } catch { data = {}; }
    if (!response.ok) throw new Error(data.error || `AI request failed (${response.status}). Check your Worker setup.`);
    if (!data.text) throw new Error("The AI returned an empty response. Please try again.");
    return data.text;
  }

  window.StudyMateAI = { askAI };
})();
