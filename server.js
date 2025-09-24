import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ---- HuggingFace Chat Function ----
async function hfChat(prompt) {
  const apiKey = process.env.HF_KEY;
  if (!apiKey) throw new Error("HF_KEY missing");

  const response = await fetch(
    "https://api-inference.huggingface.co/models/gpt2",
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ inputs: prompt })
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`HF API error: ${err}`);
  }

  const data = await response.json();

  if (Array.isArray(data)) {
    return data[0]?.generated_text || "No reply";
  } else if (data.generated_text) {
    return data.generated_text;
  } else {
    return JSON.stringify(data);
  }
}

// ---- Chat Endpoint ----
app.post("/chat", async (req, res) => {
  try {
    const { message, userLang } = req.body;

    const systemPrompt = `You are an English tutor. 
    Reply in simple English, then give translation in ${userLang}.
    Example: "I am fine. (मैं ठीक हूँ)"`;

    const reply = await hfChat(
      `${systemPrompt}\n\nUser: ${message}\nAssistant:`
    );

    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error", detail: err.message });
  }
});

// ---- Root Route ----
app.get("/", (req, res) => {
  res.send("SpeakMate backend (GPT-2) is running!");
});

// ---- Start Server ----
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
