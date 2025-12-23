# AI Quiz Autograder (Google Forms + Gemini)

This tool automates the grading of open-ended/complex Google Form quizzes using Google's Gemini 3 Flash API. It compares student responses to a hidden "Model Answer," generates a score and detailed feedback based on a rubric, and emails the results to the student and the instructor instantly.

It runs entirely within **Google Apps Script**, meaning there are no servers to set up or pay for.

## Features
- **Zero-Infrastructure:** Runs inside your Google Form.
- **Cheap/Free:** Uses `gemini-3-flash` (free tier allows ~100 requests/day).
- **Instant Feedback:** Students receive an email with their score and specific feedback seconds after submitting.
- **Non-Technical Friendly:** The Model Answer and Admin Email are stored in a Google Sheet, not in the code.

---

## 📘 Setup Guide

### Phase 1: Get your Free AI Key
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Click the blue button **Create API Key**.
3. Select **"Create API key in new project"**.
4. Copy the long code string (starts with `AIza...`).
   * *Save this somewhere safe; you will need it in Phase 3.*

### Phase 2: Prepare the Spreadsheet
1. Open the **Google Sheet** that collects your form responses. This can be found in the responses tab of the Google Form.
2. Create a new tab (at the bottom) and rename it exactly: `Settings` (Case sensitive).
3. In this new tab, fill in the following cells:


| `Model Answer` | *[Paste your Model Answer text here]* |
| `Admin Email` | *[Paste your email address here to get copies of grades]* |

4. **Copy the full URL** of this Google Sheet from your browser address bar.

### Phase 3: Install the Code
1. Go to your **Google Form** (Edit mode).
2. Click the **3 dots** (⋮) in the top right corner → Select **Script editor**.
   * *See Troubleshooting below if you get an Error 400 or a blank screen here.*
3. Delete any existing code in the file.
4. Copy and paste the code from [`Code.gs`](Code.gs) in this repository.
5. **Edit the Configuration Section** (Lines 1-15):
   * Paste your **API Key** into `GEMINI_API_KEY`.
   * Paste your **Sheet URL** into `SHEET_URL`.
6. Click the **Save icon** (floppy disk) and name the project "AutoGrader".

### Phase 4: Verification & Permissions
1. In the toolbar dropdown menu, select **`runSetupTest`**.
2. Click **Run**.
3. **Authorize the Script:**
   * A "Review Permissions" popup will appear. Click it.
   * Select your Google account.
   * *If you see "Google hasn't verified this app":* Click **Advanced** → **Go to AutoGrader (unsafe)** → **Allow**.
4. Check the **Execution Log** at the bottom. It should say `🎉 SUCCESS!`.

### Phase 5: Automation (The Trigger)
1. On the left sidebar, click the **Alarm Clock icon** ("Triggers").
2. Click **+ Add Trigger** (bottom right).
3. Configure settings:
   * **Function:** `handleFormSubmit`
   * **Event source:** `From form`
   * **Event type:** `On form submit`
4. Click **Save**.

**✅ Setup Complete!** Submit a test response to your form to see the email arrive.

---

## 🔧 Troubleshooting

### 🔴 Error 400 / Blank Screen when opening Script Editor
If you cannot open the Script Editor (Phase 3) or get a "Bad Request" error, this is a known Google issue when multiple accounts are signed in.

**The Fix:**
1. Open a **New Incognito Window** (or Private Window).
2. Log in **only** to the Google account that owns the Form.
3. Access the Script Editor from there.

### 🔴 "Exception: You do not have permission..."
If the script fails after you set up the trigger, you may need to refresh permissions.
1. Run the `runSetupTest` function manually in the editor one more time.
2. Accept any new permission prompts.
