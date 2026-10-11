# 📚 DSA Revision Tracker

A lightweight Chrome extension that saves the DSA questions you solve, from **any platform** (LeetCode, GeeksforGeeks, Codeforces, HackerRank, Coding Ninjas, etc.), into a Google Sheet with one click, and tracks how many times you've revised each one.

No backend, no database, no Google Cloud project. Just a Google Sheet, a small Apps Script, and a Chrome extension.

---

## ✨ Features

- **One-click save** from any problem page: the title, link and date are auto-filled
- **Difficulty auto-detection** where the page exposes it (you can always override it)
- **Smart duplicate handling**: saving a question that's already in your sheet increases its **Revision Count** instead of creating a new row
- **Remembers your last Type** to speed up repeated saves
- **Clean links**: tracking params are stripped, and LeetCode URLs are trimmed to `/problems/<slug>/`, so the same problem always matches
- **Your sheet is your dashboard**: sort, filter and review with Google Sheets itself

---

## 🧠 How it works

```
 Chrome Extension  ──POST/GET──▶  Google Apps Script (Web App)  ──▶  Google Sheet
   (popup UI)                      (lives inside your sheet)         (your data)
```

A Chrome extension can't write to a Google Sheet directly without OAuth and a Cloud project. Instead, a tiny script inside the sheet exposes a private URL. The extension sends the question data to that URL, protected by a secret key you choose, and the script adds a row or bumps the revision count.

---

## 📁 Project structure

```
dsa-tracker/
├── manifest.json   # Chrome extension config (Manifest V3)
├── popup.html      # Extension popup UI
├── popup.css       # Popup styles
├── popup.js        # Popup logic (auto-fill, API calls, settings)
├── Code.gs         # Google Apps Script (paste into your sheet)
└── README.md
```

---

## 🚀 Setup guide

### Step 1: Create the Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and click **Blank spreadsheet**.
2. Name it something like **DSA Revision Tracker**.
3. In **row 1**, add these headers, in this exact column order:

| A | B | C | D | E | F |
|---|---|---|---|---|---|
| Date | Question | Question_link | Type | Difficulty level | Revision Count |

> The script works by **column position**, not header text, so the order matters but spelling doesn't. Column C (the link) is what the script uses to detect duplicates.

### Step 2: Add the Apps Script

1. In your sheet, click **Extensions → Apps Script**. A new tab opens with a code editor.
2. Delete the default code, then copy the contents of [`Code.gs`](./Code.gs) and paste it in.
3. Near the top, change the secret to your own random string:
   ```js
   const SECRET = 'change-me-to-a-random-string';
   ```
   For example `'dsa-9x7k2p'`. This works like a password, so only your extension can write to your sheet. **Remember it, because you'll enter it in the extension later.**
4. If your data is not on the first tab, set `SHEET_NAME` to the tab's name. Otherwise leave it empty.
5. Press **Ctrl + S** (or **Cmd + S**) to save.

### Step 3: Deploy as a Web App

1. In the Apps Script editor, click **Deploy → New deployment**.
2. Click the ⚙ icon next to **Select type** and choose **Web app**.
3. Set:
   - **Execute as:** `Me`, so the script edits the sheet with your account
   - **Who has access:** `Anyone`, so the extension can reach it without a login (the secret protects it)
4. Click **Deploy**.
5. Google will ask you to authorize the script:
   - Choose your Google account
   - If you see *"Google hasn't verified this app"*, click **Advanced → Go to (your project) → Allow**. This is expected, since you wrote the script yourself.
6. Copy the **Web App URL**. It looks like:
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```

> ⚠️ **Updating the script later?** Apps Script keeps serving the old version until you publish a new one: **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**.

### Step 4: Install the Chrome extension

1. Clone or download this repo:
   ```bash
   git clone https://github.com/<your-username>/<your-repo>.git
   ```
2. Open Chrome and go to `chrome://extensions`.
3. Turn on **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the project folder (the one containing `manifest.json`).
5. Click the 🧩 puzzle icon in the toolbar and **pin** the extension.

### Step 5: Connect the extension to your sheet

1. Click the extension icon, then the **⚙** button in the popup.
2. Paste your **Web App URL** from Step 3.
3. Enter the **secret** you chose in Step 2. It must match exactly.
4. Click **Save settings**.

You're set up. 🎉

---

## 🎯 Usage

1. Solve a question on any platform.
2. Click the extension icon on that problem page.
3. Check the auto-filled **Question**, **Link** and **Difficulty**, then pick a **Type** (Array, DP, Graph, ...).
4. Click **Save to sheet**.

| Situation | What happens |
|---|---|
| New question | A new row is added with Revision Count `0` |
| Question already in sheet | The popup shows *"Already in sheet"*, and clicking **Mark as revised** increases Revision Count by 1 |

### Revising from the sheet

Open your sheet and use it as your revision list:
- Sort by **Revision Count** (ascending) to see what needs attention first
- Filter by **Type** or **Difficulty level** to focus a session on one topic
- Click any **Question_link** to jump straight back to the problem

---

## 🛠 Troubleshooting

| Problem | Fix |
|---|---|
| `Bad secret` | The secret in the popup doesn't match `SECRET` in `Code.gs` |
| Network error / nothing happens | Make sure access is set to **Anyone** and the URL ends with `/exec` |
| Code changes have no effect | Deploy a **new version** (see the note in Step 3) |
| Difficulty not detected | Detection is best-effort and varies by site. Select it manually. |
| Rows land in the wrong tab | Set `SHEET_NAME` in `Code.gs` and redeploy |

---

## 🔒 Security notes

- Keep your real **secret** and **Web App URL** out of the repo. The popup stores them in Chrome's extension storage, not in the code.
- Keep the placeholder in `Code.gs` when committing, and set your real secret only inside the Apps Script editor.
- Anyone with both the URL and the secret can write to your sheet, so treat them like a password.

---

## 🗺 Roadmap ideas

- [ ] Spaced-repetition "next revision date" column
- [ ] Notes / approach field per question
- [ ] Platform column (auto-detected from the URL)
- [ ] Highlight questions due for revision

---

## 🧰 Tech stack

Chrome Extension (Manifest V3) · Vanilla JavaScript · Google Apps Script · Google Sheets

---

## 🤝 Contributing

Issues and pull requests are welcome. If a platform's difficulty isn't detected correctly, a small selector fix in `scrapeDifficulty()` inside `popup.js` is a great first contribution.

## 📄 License

MIT. Use it, tweak it, make it yours.
