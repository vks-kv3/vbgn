import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Modality } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { fetch as undiciFetch, Agent } from "undici";

dotenv.config();

// Create a custom undici Agent with extremely generous timeouts (up to 5 minutes for generation)
// and disable HTTP/2 to prevent any protocol-specific headers/stream timeout errors.
const customAgent = new Agent({
  connect: {
    timeout: 120000, // 120 seconds connection timeout
  },
  headersTimeout: 300000, // 300 seconds (5 minutes) headers timeout
  bodyTimeout: 300000, // 300 seconds (5 minutes) body timeout
  allowH2: false, // Force HTTP/1.1 which is highly stable and avoids HTTP/2 specific timeouts
});

// Robustly override globalThis.fetch with undici's native fetch.
// We explicitly pass our customAgent as the dispatcher so that it uses the customized timeouts.
// This preserves all native fetch behaviors (Response instance, arrayBuffer, streaming, etc.)
// while ensuring slow Gemini API responses do not timeout.
(globalThis as any).fetch = function (input: any, init?: any): any {
  return undiciFetch(input, {
    ...init,
    dispatcher: customAgent,
  }) as any;
};

const app = express();
const PORT = 3000;

app.use(express.json());

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

function pcmToWav(pcmBuffer: Buffer, sampleRate: number = 24000): Buffer {
  const header = Buffer.alloc(44);
  const dataSize = pcmBuffer.length;
  const fileSize = dataSize + 36;

  header.write("RIFF", 0);
  header.writeUInt32LE(fileSize, 4);
  header.write("WAVE", 8);

  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);

  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

app.post("/api/tts", async (req, res) => {
  try {
    const { text, voice = "Charon", style = "hoai_niem" } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Văn bản không hợp lệ." });
    }

    if (text.trim().length === 0) {
      return res.status(400).json({ error: "Văn bản không được để trống." });
    }

    // Determine specific styling instruction to guide the TTS tone elegantly
    let styleInstruction = "";
    switch (style) {
      case "hoai_niem":
        styleInstruction = "ấm áp, dạt dào cảm xúc hoài niệm xưa, sâu lắng và tự sự nhẹ nhàng";
        break;
      case "truyen_cam":
        styleInstruction = "truyền cảm, ấm áp, có điểm nhấn tự nhiên và dạt dào tình cảm";
        break;
      case "cham_rai":
        styleInstruction = "chậm rãi, lắng đọng, suy tư, giàu chiêm nghiệm";
        break;
      case "nhe_nhang":
        styleInstruction = "dịu dàng, êm ái, thanh thản, bay bổng dịu ngọt";
        break;
      case "vui_tuoi":
        styleInstruction = "vui tươi, sinh động, rạng rỡ, hân hoan và tràn đầy năng lượng tích cực";
        break;
      default:
        styleInstruction = "tự nhiên, rõ ràng";
    }

    // We keep the prompt simple, focused, and extremely consistent.
    // This stops the model from dynamically morphing the speaker identity based on complex roleplaying descriptions,
    // ensuring the voice identity (e.g. female / male prebuilt voice) remains 100% stable, fixed, and identical.
    const prompt = `Hãy đọc đoạn văn bản tiếng Việt dưới đây một cách tự nhiên, rõ ràng, phát âm chuẩn xác tiếng Việt, ngắt nghỉ hơi đúng chỗ và thể hiện phong cách ${styleInstruction}.
Yêu cầu tối quan trọng: Giữ nguyên tông giọng đặc trưng vốn có của bạn (không thay đổi giới tính, cao độ, tốc độ hay âm sắc giữa các đoạn văn bản khác nhau), không cố gắng diễn xuất quá đà làm thay đổi bản sắc giọng đọc:

"${text}"`;

    console.log(`Generating TTS using voice ${voice} and style ${style} (length: ${text.length})...`);

    let response;
    let attempt = 0;
    const maxAttempts = 3;

    while (attempt < maxAttempts) {
      try {
        attempt++;
        response = await ai.models.generateContent({
          model: "gemini-3.1-flash-tts-preview",
          contents: [{ parts: [{ text: prompt }] }],
          config: {
            temperature: 0.0,
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voice },
              },
            },
          },
        });
        break; // Success, exit retry loop
      } catch (err: any) {
        console.warn(`TTS generation attempt ${attempt} failed:`, err);
        const errStr = err.message || "";
        const isQuotaExceeded = errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("quota") || errStr.includes("429");
        if (isQuotaExceeded || attempt >= maxAttempts) {
          throw err;
        }
        await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
      }
    }

    if (!response) {
      throw new Error("Không nhận được phản hồi từ mô hình AI.");
    }

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("Không nhận được âm thanh từ mô hình AI.");
    }

    const pcmBuffer = Buffer.from(base64Audio, "base64");
    const wavBuffer = pcmToWav(pcmBuffer, 24000);

    res.json({
      audio: wavBuffer.toString("base64"),
      format: "audio/wav",
      sampleRate: 24000,
    });
  } catch (error: any) {
    console.error("TTS API Error:", error);
    let errorMessage = error.message || "Đã xảy ra lỗi khi tạo giọng nói.";
    const errStr = JSON.stringify(error) || error.toString() || "";
    if (errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("quota") || errStr.includes("429")) {
      errorMessage = "Hệ thống đã đạt giới hạn lượt tạo giọng nói miễn phí của ngày hôm nay (mô hình thử nghiệm Gemini TTS giới hạn 10 lượt/ngày). Vui lòng thử lại sau hoặc rút ngắn văn bản nhé.";
    }
    res.status(500).json({ error: errorMessage });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

startServer();
