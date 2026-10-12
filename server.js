import express from "express";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import path from "node:path";
import { fileURLToPath } from "node:url";

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/chat", async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: "مفتاح Gemini المجاني غير مضبوط على الخادم." });
    }
    const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
    if (!message) return res.status(400).json({ error: "اكتب رسالة الأول." });
    if (message.length > 6000) return res.status(400).json({ error: "الرسالة طويلة جدًا." });

    const context = req.body?.workoutContext ?? {};
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const result = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      contents: `سياق التمرين المتاح (قد يكون فارغًا أو غير مكتمل):\n${JSON.stringify(context).slice(0, 18000)}\n\nرسالة المستخدم:\n${message}`,
      config: {
        systemInstruction: `أنت LiftLog AI Coach، مساعد ودود يتحدث باللهجة المصرية الطبيعية، ويقدر يجاوب على الأسئلة العامة أيضًا.
كن واضحًا وصريحًا ولا تدّعِ أنك طبيب أو أنك شاهدت بيانات لم تُرسل لك. عند أسئلة التمرين، استخدم سجل المستخدم المرفق إن كان مفيدًا، وميّز بين البيانات الفعلية والافتراضات. أعطِ نصائح رياضية عامة وآمنة، ولا تشجع التدريب عبر ألم حاد أو إصابة. لا تدّعِ حفظ أي شيء في قاعدة البيانات. إذا لم توجد بيانات كافية، اسأل سؤالًا توضيحيًا بدل اختلاقها.`,
        maxOutputTokens: 700
      }
    });
    const reply = (result.text || "").trim();
    return res.json({ reply: reply || "معلش يا أحمد، ماقدرتش أجهز رد دلوقتي. جرّب تاني." });
  } catch (err) {
    console.error("LiftLog Gemini error:", err?.message || err);
    return res.status(500).json({ error: "حصلت مشكلة أثناء طلب رد الذكاء الاصطناعي. راجع إعدادات الخادم ومفتاح Gemini." });
  }
});

app.listen(port, () => console.log(`LiftLog is running on port ${port}`));
