import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ---- DeepSeek Chat Function ----
async function deepseekChat(messages, max_tokens = 500) {
  const apiKey = process.env.DEEPSEEK_KEY;
  if (!apiKey) throw new Error("DEEPSEEK_KEY missing");

  const body = {
    model: "deepseek-chat",
    messages,
    max_tokens
  };

  const resp = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    const errorText = await resp.text();
    throw new Error(`DeepSeek API error: ${errorText}`);
  }

  const data = await resp.json();
  return data.choices?.[0]?.message?.content || "No reply";
}

// ---- Chat Endpoint ----
app.post("/chat", async (req, res) => {
  try {
    const { message, userLang } = req.body;

    const systemPrompt = `You are an English learning assistant. The user speaks ${userLang}. 
    Reply in English and also provide the translation in ${userLang}.`;

    const assistantText = await deepseekChat([
      { role: "system", content: systemPrompt },
      { role: "user", content: message }
    ], 500);

    res.json({ reply: assistantText });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error", detail: err.message });
  }
});

// ---- Root Route ----
app.get("/", (req, res) => {
  res.send("SpeakMate backend (DeepSeek) is running!");
});

// ---- Start Server ----
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
