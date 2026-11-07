# StudyMate AI ✦

A responsive AI-powered study dashboard built with **HTML, CSS, and vanilla JavaScript**. It includes an AI study chat, smart summaries, quiz generation, and a study task planner.

## Features

- Dark navy and purple interface with a light-theme toggle.
- AI Study Chat for explanations and follow-up questions.
- Smart Summary for pasted lecture notes.
- Quiz Generator with question-count and difficulty options.
- Study Planner with due dates, completion progress, and browser local storage.
- Responsive sidebar and mobile layout.
- Optional real Gemini model connection through a Cloudflare Worker proxy.
- Demo responses work before the AI service is configured.

## Folder structure

```text
AI-StudyMate/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── config.js
│   ├── ai.js
│   ├── app.js
│   └── planner.js
├── worker/
│   ├── index.js
│   └── wrangler.toml
├── .gitignore
└── README.md
```

## 1. Run locally in VS Code

1. Download or clone this repository and open the `AI-StudyMate` folder in VS Code.
2. Install the **Live Server** extension if you do not already have it.
3. Right-click `index.html` and select **Open with Live Server**.
4. The interface and Study Planner work immediately. Until you configure the AI endpoint, AI tools show demo responses.

You can also open `index.html` directly in a browser for basic UI testing, but Live Server is recommended.

## 2. Connect a real AI model (Gemini API)

The frontend does **not** contain the secret API key. The browser calls a small Cloudflare Worker, and the Worker calls Gemini.

### Get a Gemini API key

1. Open [Google AI Studio](https://aistudio.google.com/apikey).
2. Sign in and create an API key for a project that is eligible to use the Gemini API.
3. Review the current availability, quotas, terms, and pricing before using the key. Free access and model availability can change.
4. Never paste the key into `js/config.js`, `index.html`, or any public GitHub file.

### Deploy the Worker

1. Create/sign in to a [Cloudflare account](https://dash.cloudflare.com/).
2. Install Node.js LTS, then install Wrangler from a terminal:

   ```bash
   npm install -g wrangler
   ```

3. Open a terminal in the `worker` directory and sign in:

   ```bash
   npx wrangler login
   ```

4. Add the API key as a secret (the terminal will prompt you to enter it):

   ```bash
   npx wrangler secret put GEMINI_API_KEY
   ```

5. Deploy the Worker:

   ```bash
   npx wrangler deploy
   ```

6. Copy the Worker URL shown after deployment. It should look similar to `https://studymate-ai.YOUR-SUBDOMAIN.workers.dev`.

7. Open `js/config.js` and set `API_BASE_URL` to your Worker URL, without a trailing slash:

   ```js
   window.STUDYMATE_CONFIG = {
     API_BASE_URL: "https://studymate-ai.YOUR-SUBDOMAIN.workers.dev"
   };
   ```

8. Save and refresh the website. Try AI Study Chat, Smart Summary, and Quiz Generator.

### Important security notes

- Do not commit the API key to GitHub. The key belongs in the Worker secret only.
- For a public deployment, change `ALLOWED_ORIGINS` in `worker/wrangler.toml` from `*` to your exact GitHub Pages origin, such as `https://YOUR-USERNAME.github.io`. If you publish from a project repository, the origin is still `https://YOUR-USERNAME.github.io` (the repository path is not part of the origin).
- Add reasonable usage limits and monitor your API usage before sharing the app widely. CORS is not authentication and, by itself, does not stop direct requests to a public Worker.
- Gemini free-tier limits, model availability, data handling, and terms can change. Do not submit sensitive personal or university information.

## 3. Publish the website with GitHub Pages

1. Create a GitHub repository, for example `ai-studymate`.
2. Upload the **frontend files**: `index.html`, `css/`, `js/`, `README.md`, and `.gitignore`. You may keep the `worker/` directory in the repository as source code, but deploy it separately with Wrangler. Never upload your API key.
3. On GitHub, open the repository **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Select branch `main` and folder `/ (root)`, then save.
6. Wait for GitHub Pages to finish publishing. Your URL will look like `https://YOUR-USERNAME.github.io/ai-studymate/`.
7. Check `js/config.js` contains the deployed Worker URL and check that the Worker allows your site's origin.

## 4. Troubleshooting

- **Demo response appears:** `API_BASE_URL` is empty. Add your deployed Worker URL.
- **CORS error:** Set `ALLOWED_ORIGINS` to your exact site origin in `worker/wrangler.toml`, redeploy, and try again. An origin has no trailing slash or repository path.
- **Missing GEMINI_API_KEY:** Run `npx wrangler secret put GEMINI_API_KEY` in the Worker project and deploy again.
- **429 / quota error:** You may have reached the current model or project rate limit. Check AI Studio usage and quotas.
- **Model not found:** Check the currently available model names for your project, update `GEMINI_MODEL` in `worker/wrangler.toml`, then redeploy.
- **Planner tasks disappeared:** Tasks are stored in that browser's local storage. They do not automatically sync across devices or browsers.

## Technologies

HTML5 · CSS3 · Vanilla JavaScript · Gemini API · Cloudflare Workers · GitHub Pages

## License

For learning and portfolio use. Add a license file if you choose to distribute the project under a specific license.
