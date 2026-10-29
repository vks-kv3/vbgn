import { GoogleGenAI, Modality } from "@google/genai";

const STYLE_INSTRUCTIONS: Record<string, string> = {
  hoai_niem: "ấm áp, dạt dào cảm xúc hoài niệm xưa, sâu lắng và tự sự nhẹ nhàng",
  truyen_cam: "truyền cảm, ấm áp, có điểm nhấn tự nhiên và dạt dào tình cảm",
  cham_rai: "chậm rãi, lắng đọng, suy tư, giàu chiêm nghiệm",
  nhe_nhang: "dịu dàng, êm ái, thanh thản, bay bổng dịu ngọt",
  vui_tuoi: "vui tươi, sinh động, rạng rỡ, hân hoan và tràn đầy năng lượng tích cực",
};

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

// Wrap raw 16-bit mono PCM from Gemini in a WAV header so <audio> can play it.
function pcmToWav(pcm: Uint8Array, sampleRate = 24000): Uint8Array {
  const out = new Uint8Array(44 + pcm.length);
  const v = new DataView(out.buffer);
  const str = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  str(0, "RIFF");
  v.setUint32(4, 36 + pcm.length, true);
  str(8, "WAVE");
  str(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  str(36, "data");
  v.setUint32(40, pcm.length, true);
  out.set(pcm, 44);
  return out;
}

function isQuotaError(err: any): boolean {
  const s = `${err?.message || ""} ${JSON.stringify(err) || ""}`;
  return s.includes("RESOURCE_EXHAUSTED") || s.includes("quota") || s.includes("429");
}

function isKeyError(err: any): boolean {
  const s = `${err?.message || ""} ${JSON.stringify(err) || ""}`;
  return s.includes("API_KEY_INVALID") || s.includes("API key not valid") || s.includes("PERMISSION_DENIED");
}

/** Generates speech in the browser and returns a playable data: URI (audio/wav). */
export async function generateSpeech(opts: {
  apiKey: string;
  text: string;
  voice: string;
  style: string;
}): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: opts.apiKey });
  const styleInstruction = STYLE_INSTRUCTIONS[opts.style] || "tự nhiên, rõ ràng";

  const prompt = `Hãy đọc đoạn văn bản tiếng Việt dưới đây một cách tự nhiên, rõ ràng, phát âm chuẩn xác tiếng Việt, ngắt nghỉ hơi đúng chỗ và thể hiện phong cách ${styleInstruction}.
Yêu cầu tối quan trọng: Giữ nguyên tông giọng đặc trưng vốn có của bạn (không thay đổi giới tính, cao độ, tốc độ hay âm sắc giữa các đoạn văn bản khác nhau), không cố gắng diễn xuất quá đà làm thay đổi bản sắc giọng đọc:

"${opts.text}"`;

  let response;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          temperature: 0.0,
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: opts.voice } },
          },
        },
      });
      break;
    } catch (err: any) {
      console.warn(`TTS attempt ${attempt} failed:`, err);
      if (isKeyError(err)) {
        throw new Error("API key không hợp lệ. Vui lòng kiểm tra lại key Gemini của bạn.");
      }
      if (isQuotaError(err)) {
        throw new Error(
          "Key của bạn đã hết lượt tạo giọng nói miễn phí hôm nay (mô hình thử nghiệm Gemini TTS có giới hạn lượt/ngày). Vui lòng thử lại sau."
        );
      }
      if (attempt >= 3) throw err;
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }

  const b64 = response?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!b64) throw new Error("Không nhận được âm thanh từ mô hình AI.");

  const wav = pcmToWav(base64ToBytes(b64), 24000);
  return `data:audio/wav;base64,${bytesToBase64(wav)}`;
}
