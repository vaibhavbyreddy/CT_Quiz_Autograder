/**
 * ============================================================================
 * 🛠️ USER CONFIGURATION (EDIT THIS SECTION ONLY)
 * ============================================================================
 */

// 1. Paste your Gemini API Key here (Keep the quotes!)
// Get it from: https://aistudio.google.com/app/apikey
const GEMINI_API_KEY = "PASTE_YOUR_API_KEY_HERE";

// 2. Paste the FULL URL of your Google Sheet here
// Example: "https://docs.google.com/spreadsheets/d/1aBcDeFgH.../edit"
const SHEET_URL = "PASTE_YOUR_FULL_SHEET_LINK_HERE";

// 3. Do you want to email the student automatically? (true or false)
const EMAIL_STUDENT = true;

/**
 * ============================================================================
 * ⛔ DO NOT EDIT BELOW THIS LINE (UNLESS YOU ARE A DEVELOPER)
 * ============================================================================
 */

const GEMINI_MODEL = "gemini-1.5-flash"; // Free tier friendly model

/**
 * MAIN TRIGGER: Runs automatically when a student submits the form.
 */
function handleFormSubmit(e) {
  if (!e) {
    console.log("⚠️ No event data. If testing, run 'runSetupTest' instead.");
    return;
  }

  try {
    // 1. Setup & Read Settings
    const sheetId = extractSheetID(SHEET_URL);
    const settings = getSettings(sheetId);
    
    // 2. Collect Student Data
    const formResponse = e.response;
    const studentEmail = formResponse.getRespondentEmail();
    
    // Safety Check: If email collection is off
    if (!studentEmail) {
      console.log("⚠️ Warning: No student email found. Check Form Settings.");
    }

    const itemResponses = formResponse.getItemResponses();
    let studentFullResponse = `Student Email: ${studentEmail || "Anonymous"}\n\n`;
    
    for (let i = 0; i < itemResponses.length; i++) {
      studentFullResponse += `**${itemResponses[i].getItem().getTitle()}**:\n${itemResponses[i].getResponse()}\n\n`;
    }

    // 3. Grade with Gemini
    const gradeData = callGeminiAPI(studentFullResponse, settings.modelAnswer);

    // 4. Send Emails
    const emailSubject = `Trauma CT Result: ${gradeData.total_score}/24`;
    const emailBody = formatEmailBody(gradeData);

    // Email Student (if enabled & email exists)
    if (EMAIL_STUDENT && studentEmail) {
      MailApp.sendEmail({
        to: studentEmail,
        subject: emailSubject,
        body: emailBody
      });
    }

    // Email Admin (from Settings tab)
    if (settings.adminEmail) {
      MailApp.sendEmail({
        to: settings.adminEmail,
        subject: `[ADMIN] ${studentEmail || "Anon"} Scored ${gradeData.total_score}`,
        body: `Reviewing Submission for: ${studentEmail}\n\n${emailBody}`
      });
    }

  } catch (error) {
    console.error("❌ CRITICAL ERROR:", error.message);
    // Try to notify admin of the crash
    try {
      MailApp.sendEmail({
        to: Session.getActiveUser().getEmail(),
        subject: "⚠️ Quiz Autograder Crashed",
        body: `Error details: ${error.message}\n\nCheck the Apps Script Execution Log.`
      });
    } catch (e) { /* If this fails, we can't do anything */ }
  }
}

/**
 * 🧪 SETUP TEST: Run this manually to verify permissions and connections.
 */
function runSetupTest() {
  console.log("1. Checking Spreadsheet Connection...");
  const sheetId = extractSheetID(SHEET_URL);
  console.log("   ✅ ID Extracted: " + sheetId);
  
  console.log("2. Reading 'Settings' tab...");
  const settings = getSettings(sheetId);
  console.log("   ✅ Model Answer Found: " + (settings.modelAnswer ? "Yes" : "No"));
  console.log("   ✅ Admin Email: " + settings.adminEmail);

  console.log("3. Testing Permissions...");
  FormApp.getActiveForm();
  console.log("   ✅ Form Permission Granted");
  
  console.log("🎉 SUCCESS! Your setup is correct. You can now add the Trigger.");
}

// --- HELPER FUNCTIONS ---

function extractSheetID(url) {
  try {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) return match[1];
    throw new Error("Invalid URL");
  } catch (e) {
    throw new Error("Could not find Sheet ID. Please check the 'SHEET_URL' at the top of the code.");
  }
}

function getSettings(id) {
  const ss = SpreadsheetApp.openById(id);
  const sheet = ss.getSheetByName("Settings");
  if (!sheet) throw new Error("Could not find a tab named 'Settings' in your Google Sheet.");
  
  return {
    modelAnswer: sheet.getRange("B2").getValue(),
    adminEmail: sheet.getRange("B3").getValue()
  };
}

function formatEmailBody(data) {
  return `Hi there,\n\n` +
         `Here is the result of your Trauma CT Interpretation.\n` +
         `------------------------------------------------\n` +
         `SCORE: ${data.total_score} / 24\n` +
         `------------------------------------------------\n\n` +
         `FEEDBACK SUMMARY:\n${data.feedback_summary}\n\n` +
         `DETAILED FEEDBACK:\n` +
         `A: ${data.section_breakdown.A}\n` +
         `B: ${data.section_breakdown.B}\n` +
         `C: ${data.section_breakdown.C}\n` +
         `D: ${data.section_breakdown.D}\n` +
         `E: ${data.section_breakdown.E}\n\n` +
         `Automated Grading System`;
}

function callGeminiAPI(studentText, modelAnswer) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  
  const systemPrompt = `
  ### ROLE
  You are a Senior Consultant Radiologist. Grade the student's Trauma CT interpretation.
  
  ### MODEL ANSWER
  ${modelAnswer}
  
  ### MARKING SCHEME
  Score 0 (Missed), 2 (Partial), or 4 (Perfect) per section. Max Score: 24.
  
  ### OUTPUT FORMAT
  Return strictly valid JSON with this structure:
  {
    "total_score": number,
    "feedback_summary": "string",
    "section_breakdown": { "A": "string", "B": "string", "C": "string", "D": "string", "E": "string" }
  }`;

  const payload = {
    "system_instruction": { "parts": [{ "text": systemPrompt }] },
    "contents": [{ "parts": [{ "text": "Student Response:\n" + studentText }] }],
    "generationConfig": { "response_mime_type": "application/json", "temperature": 0.2 }
  };

  const response = UrlFetchApp.fetch(url, {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify(payload)
  });
  
  const json = JSON.parse(response.getContentText());
  return JSON.parse(json.candidates[0].content.parts[0].text);
}
