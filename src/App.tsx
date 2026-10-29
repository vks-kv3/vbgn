import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  BookOpen,
  History,
  Trash2,
  PenTool,
  Volume2,
  Mic,
  ArrowRight,
  RefreshCw,
  Plus,
  Compass,
  Smile,
  Copy,
  Check,
  KeyRound,
  Eye,
  EyeOff,
  ChevronDown
} from "lucide-react";

import { SPEECH_PRESETS, TTS_VOICES, TTS_STYLES, LOADING_PHRASES } from "./data";
import { SpeechHistoryItem } from "./types";
import AudioPlayer from "./components/AudioPlayer";
import { getHistory, saveHistoryItem, deleteHistoryItemFromDb, clearAllHistoryFromDb } from "./db";
import { generateSpeech } from "./tts";

const API_KEY_STORAGE = "gemini_api_key";

export default function App() {
  const [text, setText] = useState<string>("");
  const [selectedVoice, setSelectedVoice] = useState<string>("Charon");
  const [selectedStyle, setSelectedStyle] = useState<string>("hoai_niem");
  
  // Audio state
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioTitle, setAudioTitle] = useState<string>("");
  const [audioSubtitle, setAudioSubtitle] = useState<string>("");

  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingPhraseIndex, setLoadingPhraseIndex] = useState<number>(0);
  const [history, setHistory] = useState<SpeechHistoryItem[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Gemini API key, entered by each visitor and kept only in their own browser
  const [apiKey, setApiKey] = useState<string>(() => {
    try {
      return localStorage.getItem(API_KEY_STORAGE) || "";
    } catch {
      return "";
    }
  });
  const [showKey, setShowKey] = useState<boolean>(false);
  const [showKeyPanel, setShowKeyPanel] = useState<boolean>(() => {
    try {
      return !localStorage.getItem(API_KEY_STORAGE);
    } catch {
      return true;
    }
  });

  const handleSaveKey = (value: string) => {
    setApiKey(value);
    try {
      if (value.trim()) localStorage.setItem(API_KEY_STORAGE, value.trim());
      else localStorage.removeItem(API_KEY_STORAGE);
    } catch {
      /* storage unavailable: keep key in memory only */
    }
  };

  // Cycle loading phrases during TTS generation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingPhraseIndex((prev) => (prev + 1) % LOADING_PHRASES.length);
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // Load history from IndexedDB on startup
  useEffect(() => {
    getHistory().then((saved) => {
      if (saved) {
        setHistory(saved);
      }
    }).catch(err => {
      console.error("Failed to load IndexedDB history:", err);
    });
  }, []);

  const triggerToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Pre-load preset
  const handleSelectPreset = (presetText: string, title: string, category: string) => {
    setText(presetText);
    triggerToast(`Đã tải đoạn trích "${title}"`);
    // Scroll to input on mobile
    const inputElem = document.getElementById("text-input-area");
    if (inputElem) {
      inputElem.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Clear text
  const handleClearText = () => {
    setText("");
    triggerToast("Đã nháp sạch khung văn bản");
  };

  // Convert to TTS Speech
  const handleConvertToSpeech = async () => {
    if (!text || text.trim().length === 0) {
      triggerToast("Vui lòng nhập văn bản cần chuyển đổi.");
      return;
    }

    if (!apiKey.trim()) {
      triggerToast("Vui lòng nhập Gemini API key trước khi tạo giọng nói.");
      setShowKeyPanel(true);
      document.getElementById("api-key-card")?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    setIsLoading(true);
    setLoadingPhraseIndex(0);
    setAudioUrl(null);

    const activeVoice = TTS_VOICES.find((v) => v.id === selectedVoice);
    const activeStyle = TTS_STYLES.find((s) => s.id === selectedStyle);

    try {
      const generatedAudioUri = await generateSpeech({
        apiKey: apiKey.trim(),
        text,
        voice: selectedVoice,
        style: selectedStyle,
      });
      setAudioUrl(generatedAudioUri);

      // Generate a title based on first words of text
      const cleanText = text.trim();
      const generatedTitle = cleanText.split(" ").slice(0, 5).join(" ") + (cleanText.split(" ").length > 5 ? "..." : "");
      setAudioTitle(generatedTitle);
      setAudioSubtitle(
        `Giọng ${activeVoice?.displayName || selectedVoice} • Cảm xúc ${activeStyle?.name || "Hoài niệm"}`
      );

      // Save to History logs
      const newItem: SpeechHistoryItem = {
        id: Date.now().toString(),
        title: generatedTitle,
        text: text,
        voiceId: selectedVoice,
        voiceName: activeVoice?.displayName || selectedVoice,
        styleId: selectedStyle,
        styleName: activeStyle?.name || "Hoài Niệm Xưa",
        audioUrl: generatedAudioUri,
        duration: 0, // determined dynamically on metadata load
        createdAt: new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        }) + " • " + new Date().toLocaleDateString("vi-VN"),
      };

      const updatedHistory = [newItem, ...history].slice(0, 30); // limit to last 30 items
      setHistory(updatedHistory);
      await saveHistoryItem(newItem);
      triggerToast("Chuyển giọng nói thành công và đã lưu vào Nhật Ký!");
    } catch (error: any) {
      console.error(error);
      triggerToast(error.message || "Đã xảy ra lỗi hệ thống, vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  // Play an item from the history log
  const handlePlayFromHistory = (item: SpeechHistoryItem) => {
    setAudioUrl(item.audioUrl);
    setAudioTitle(item.title);
    setAudioSubtitle(`Giọng ${item.voiceName} • Cảm xúc ${item.styleName}`);
    setText(item.text);
    triggerToast(`Đang mở lại giọng đọc hoài niệm: "${item.title}"`);
    
    // Scroll to player
    const playerCard = document.getElementById("audio-player-card");
    if (playerCard) {
      playerCard.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Delete a history item
  const handleDeleteHistoryItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter((item) => item.id !== id);
    setHistory(updated);
    await deleteHistoryItemFromDb(id);
    triggerToast("Đã xóa mục ghi âm khỏi Nhật Ký.");
  };

  // Clear all history
  const handleClearAllHistory = async () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử Nhật ký ghi âm không?")) {
      setHistory([]);
      await clearAllHistoryFromDb();
      triggerToast("Nhật ký hoài niệm đã được dọn sạch.");
    }
  };

  // Copy text to clipboard
  const handleCopyText = (textToCopy: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(id);
    triggerToast("Đã sao chép văn bản thành công!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-vintage-50 text-vintage-950 font-sans flex flex-col selection:bg-vintage-300 selection:text-vintage-900 pb-12 relative" id="app-root">
      {/* Decors: Soft Vintage borders and ambient background glows */}
      <div className="absolute top-0 inset-x-0 h-2.5 bg-gradient-to-r from-vintage-600 via-vintage-400 to-vintage-700"></div>
      
      {/* Floating toast notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-vintage-900 text-vintage-50 px-5 py-3 rounded-full shadow-2xl flex items-center gap-2 border border-vintage-800 text-xs sm:text-sm font-medium"
          >
            <Sparkles className="w-4 h-4 text-vintage-300 animate-pulse" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main container */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex flex-col">
        
        {/* Editorial Header */}
        <header className="py-10 mb-10 flex flex-col md:flex-row justify-between items-baseline border-b border-vintage-300">
          <div className="flex flex-col">
            <h1 className="text-4xl sm:text-5xl font-serif font-bold tracking-tight italic text-vintage-800">Hoài Niệm Xưa</h1>
            <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-vintage-500 mt-1.5">
              Thanh âm của những mảnh ký ức & Lời Thời Gian
            </span>
          </div>
          <div className="mt-4 md:mt-0 font-sans text-xs uppercase tracking-widest text-vintage-600 flex gap-6 sm:gap-8">
            <span className="hover:text-vintage-800 transition-colors cursor-help" title="Công nghệ chuyển đổi cảm xúc">Phiên bản 1.0.5</span>
            <span className="hover:text-vintage-800 transition-colors">Giọng Nam & Nữ Bắc</span>
            <span className="hover:text-vintage-800 transition-colors">Gemini Flash TTS</span>
          </div>
        </header>

        {/* Desktop 3-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT SIDEBAR: Presets & Configurations (Col span 4) */}
          <div className="lg:col-span-4 flex flex-col gap-6 w-full">

            {/* Gemini API key card */}
            <motion.div
              id="api-key-card"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className={`bg-vintage-100 border rounded-xl p-6 shadow-sm ${
                apiKey.trim() ? "border-vintage-300" : "border-vintage-600 ring-2 ring-vintage-400/40"
              }`}
            >
              <button
                onClick={() => setShowKeyPanel((v) => !v)}
                className="w-full flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-vintage-700" />
                  <h2 className="font-serif font-bold text-base text-vintage-900">Gemini API Key</h2>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-full border ${
                      apiKey.trim()
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {apiKey.trim() ? "Đã lưu" : "Chưa có"}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-vintage-600 transition-transform ${showKeyPanel ? "rotate-180" : ""}`}
                  />
                </div>
              </button>

              {showKeyPanel && (
                <div className="mt-4 flex flex-col gap-3">
                  <p className="text-xs text-vintage-600 leading-relaxed">
                    Ứng dụng dùng key Gemini của chính bạn. Key chỉ được lưu trong trình duyệt này và gửi thẳng tới
                    Google, không đi qua máy chủ nào khác.
                  </p>
                  <div className="relative">
                    <input
                      type={showKey ? "text" : "password"}
                      value={apiKey}
                      onChange={(e) => handleSaveKey(e.target.value)}
                      placeholder="Dán API key bắt đầu bằng AIza..."
                      autoComplete="off"
                      spellCheck={false}
                      className="w-full bg-vintage-50 border-2 border-vintage-200 focus:border-vintage-500 rounded-xl py-2.5 pl-3 pr-10 font-mono text-xs text-vintage-900 placeholder-vintage-400 focus:outline-none"
                    />
                    <button
                      onClick={() => setShowKey((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-vintage-500 hover:text-vintage-800"
                      title={showKey ? "Ẩn key" : "Hiện key"}
                      type="button"
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <a
                      href="https://aistudio.google.com/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-vintage-700 underline underline-offset-2 hover:text-vintage-900"
                    >
                      Lấy key miễn phí tại Google AI Studio →
                    </a>
                    {apiKey && (
                      <button
                        onClick={() => {
                          handleSaveKey("");
                          triggerToast("Đã xóa API key khỏi trình duyệt.");
                        }}
                        className="text-red-700 hover:underline"
                        type="button"
                      >
                        Xóa key
                      </button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Presets Card */}
            <motion.div
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-vintage-100 border border-vintage-300 rounded-xl p-6 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-4 h-4 text-vintage-700" />
                <h2 className="font-serif font-bold text-base text-vintage-900">Áng Văn Hoài Niệm</h2>
              </div>
              
              <p className="text-xs text-vintage-600 mb-3.5">
                Chọn một áng văn thơ có sẵn dưới đây để kiểm nghiệm ngay giọng đọc dạt dào cảm xúc:
              </p>

              <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                {SPEECH_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset.text, preset.title, preset.category)}
                    className="w-full text-left p-3.5 bg-vintage-50 hover:bg-vintage-200/60 border-b border-vintage-300/40 transition-all group flex flex-col gap-1 active:scale-[0.99] hover:pl-4 transition-all duration-300"
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="font-serif font-semibold text-xs text-vintage-800 leading-none group-hover:text-vintage-900">
                        {preset.title}
                      </span>
                      <span className="text-[9px] font-mono uppercase bg-vintage-200/60 text-vintage-600 px-1.5 py-0.5 rounded-md scale-95">
                        {preset.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-vintage-500 font-serif italic">Tác giả: {preset.author}</p>
                    <p className="text-[11px] text-vintage-600 line-clamp-2 mt-1 leading-normal font-sans">
                      {preset.text}
                    </p>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Vocal Customization Card */}
            <motion.div
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="bg-vintage-100 border border-vintage-300 rounded-xl p-6 shadow-sm flex flex-col gap-5"
            >
              <div className="flex items-center gap-2 pb-1 border-b border-vintage-300/60">
                <Compass className="w-4 h-4 text-vintage-700" />
                <h2 className="font-serif font-bold text-base text-vintage-900">Cấu Hình Giọng Đọc</h2>
              </div>

              {/* Prebuilt Voice Name */}
              <div>
                <label className="block text-xs font-sans uppercase mb-2 text-vintage-500 tracking-wider">
                  1. Nhân vật & Giọng đọc
                </label>
                <div className="grid grid-cols-1 gap-2.5">
                  {TTS_VOICES.map((voice) => (
                    <button
                      key={voice.id}
                      onClick={() => setSelectedVoice(voice.id)}
                      className={`flex flex-col text-left p-3 rounded-xl border transition-all active:scale-[0.99] ${
                        selectedVoice === voice.id
                          ? "bg-vintage-800 border-vintage-800 text-vintage-50 shadow-md"
                          : "bg-vintage-50 border-vintage-300/40 text-vintage-900 hover:bg-vintage-200/50"
                      }`}
                    >
                      <div className="flex justify-between items-center w-full mb-1">
                        <span className="font-serif font-bold text-xs">{voice.displayName} ({voice.name})</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[8.5px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            voice.gender === "nu"
                              ? selectedVoice === voice.id
                                ? "bg-rose-500/30 text-rose-200 border border-rose-500/40"
                                : "bg-rose-100/80 text-rose-700 border border-rose-200"
                              : selectedVoice === voice.id
                                ? "bg-sky-500/30 text-sky-200 border border-sky-500/40"
                                : "bg-sky-100/80 text-sky-700 border border-sky-200"
                          }`}>
                            {voice.gender === "nu" ? "Nữ Bắc" : "Nam Bắc"}
                          </span>
                          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full ${
                            selectedVoice === voice.id ? "bg-vintage-700 text-vintage-100" : "bg-vintage-200/60 text-vintage-600"
                          }`}>
                            {voice.tone}
                          </span>
                        </div>
                      </div>
                      <p className={`text-[11px] leading-snug ${
                        selectedVoice === voice.id ? "text-vintage-200" : "text-vintage-600"
                      }`}>
                        {voice.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Emotional Style */}
              <div>
                <label className="block text-xs font-sans uppercase mb-2 text-vintage-500 tracking-wider">
                  2. Sắc thái & Cảm xúc
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TTS_STYLES.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      className={`p-3 text-left rounded-xl border transition-all flex flex-col gap-1 cursor-pointer active:scale-95 ${
                        selectedStyle === style.id
                          ? "ring-2 ring-vintage-700 border-transparent font-medium"
                          : "border-vintage-300/40 hover:bg-vintage-200/50"
                      } ${style.colorClass}`}
                    >
                      <span className="font-serif font-bold text-xs leading-none">
                        {style.name}
                      </span>
                      <span className="text-[9.5px] leading-tight text-vintage-700/80 line-clamp-2">
                        {style.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

            </motion.div>
          </div>

          {/* MAIN CONTENT AREA: Text area, Player, History (Col span 8) */}
          <div className="lg:col-span-8 flex flex-col gap-6 w-full">
            
            {/* Input & TTS execution card */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-vintage-100 border border-vintage-300 rounded-xl p-6 shadow-sm flex flex-col gap-4 relative"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PenTool className="w-4 h-4 text-vintage-700" />
                  <h2 className="font-serif font-bold text-base text-vintage-900">Bản Thảo Nội Dung</h2>
                </div>
                {text.length > 0 && (
                  <button
                    onClick={handleClearText}
                    className="text-xs text-vintage-600 hover:text-vintage-900 font-mono flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Dọn nháp
                  </button>
                )}
              </div>

              {/* Textarea container */}
              <div className="relative">
                <textarea
                  id="text-input-area"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Nhập những dòng ký ức hoài niệm xưa, những tản văn đầy xúc cảm, hay đơn giản là một lời thầm thì gửi gắm tâm sự tại đây để chuyển thành giọng nói nam miền Bắc ấm áp..."
                  className="w-full h-60 bg-vintage-50 border-2 border-vintage-200 focus:border-vintage-500 rounded-2xl p-4 font-serif text-sm text-vintage-900 placeholder-vintage-400 focus:outline-none resize-none leading-relaxed transition-all shadow-inner"
                />
                
                {/* Character count */}
                <div className="absolute bottom-3 right-4 text-[10px] font-mono text-vintage-400 bg-vintage-50/80 px-2 py-0.5 rounded-full">
                  {text.length.toLocaleString("vi-VN")} ký tự
                </div>
              </div>

              {/* Conversion Buttons row */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
                <div className="text-[11px] text-vintage-500 italic max-w-sm text-center sm:text-left">
                  Mẹo: Nhấn nút bên trái để nạp các đoạn văn thơ mẫu kinh điển nếu chưa biết viết gì nhé.
                </div>

                <button
                  onClick={handleConvertToSpeech}
                  disabled={isLoading || text.trim().length === 0}
                  className="w-full sm:w-auto px-8 py-3 bg-vintage-800 hover:bg-vintage-700 text-vintage-50 font-sans text-xs uppercase tracking-[0.2em] rounded-none border border-vintage-800 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang dệt giọng nói...</span>
                    </>
                  ) : (
                    <>
                      <span>Khơi dòng hoài niệm</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Poetic Loading state overlay */}
              <AnimatePresence>
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-vintage-100/95 rounded-3xl flex flex-col items-center justify-center p-6 z-30"
                  >
                    <div className="flex gap-1 items-end h-12 mb-5">
                      {/* Interactive breathing soundwave graphic */}
                      <span className="w-1.5 h-6 bg-vintage-600 rounded-full origin-bottom" style={{ animation: "wave 1.2s ease-in-out infinite" }}></span>
                      <span className="w-1.5 h-10 bg-vintage-700 rounded-full origin-bottom" style={{ animation: "wave 1.2s ease-in-out infinite 0.15s" }}></span>
                      <span className="w-1.5 h-12 bg-vintage-800 rounded-full origin-bottom" style={{ animation: "wave 1.2s ease-in-out infinite 0.3s" }}></span>
                      <span className="w-1.5 h-8 bg-vintage-700 rounded-full origin-bottom" style={{ animation: "wave 1.2s ease-in-out infinite 0.45s" }}></span>
                      <span className="w-1.5 h-5 bg-vintage-600 rounded-full origin-bottom" style={{ animation: "wave 1.2s ease-in-out infinite 0.6s" }}></span>
                    </div>
                    
                    <motion.p
                      key={loadingPhraseIndex}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.5 }}
                      className="text-vintage-800 font-serif font-medium text-base text-center italic max-w-md px-4 leading-relaxed"
                    >
                      "{LOADING_PHRASES[loadingPhraseIndex]}"
                    </motion.p>
                    
                    <p className="text-[11px] font-mono text-vintage-400 mt-6 uppercase tracking-wider">
                      Đang xử lý thông qua Gemini TTS AI
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>

            {/* Audio player render target */}
            <AnimatePresence>
              {(audioUrl || isLoading) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 100 }}
                  className="w-full flex justify-center"
                >
                  <AudioPlayer
                    audioUrl={audioUrl}
                    title={audioTitle || "Hoài Niệm Âm Thanh"}
                    subtitle={audioSubtitle || "Đang chuẩn bị phát..."}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* HISTORY LOGS CARD */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-vintage-100 border border-vintage-300 rounded-xl p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-vintage-300/60">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-vintage-700" />
                  <h2 className="font-serif font-bold text-base text-vintage-900">Nhật Ký Lời Hoài Niệm</h2>
                </div>
                {history.length > 0 && (
                  <button
                    onClick={handleClearAllHistory}
                    className="text-xs text-red-700 hover:text-red-900 hover:underline flex items-center gap-1 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Xóa toàn bộ nhật ký
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <div className="text-center py-12 text-vintage-400 flex flex-col items-center justify-center gap-2 bg-vintage-50/50 rounded-2xl border border-dashed border-vintage-300/60">
                  <Smile className="w-8 h-8 text-vintage-300" />
                  <p className="font-serif text-sm">Nhật ký hoài niệm của bạn hiện đang trống trải.</p>
                  <p className="text-xs max-w-xs px-4">Hãy nhập văn bản và nhấn nút "Khơi dòng hoài niệm" để lưu giữ những giọng đọc cảm xúc đầu tiên nhé!</p>
                </div>
              ) : (
                <div className="space-y-3.5 max-h-[400px] overflow-y-auto pr-1">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handlePlayFromHistory(item)}
                      className="w-full text-left p-4 bg-vintage-50 hover:bg-vintage-200/40 border-b border-vintage-300/40 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                    >
                      <div className="flex-1 min-w-0 flex flex-col gap-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-serif font-bold text-sm text-vintage-900">
                            {item.title}
                          </span>
                          <span className="text-[9px] font-mono bg-vintage-200 text-vintage-700 px-2 py-0.5 rounded-full border border-vintage-300/30">
                            Giọng {item.voiceName} • {item.styleName}
                          </span>
                        </div>
                        <p className="text-xs text-vintage-600 line-clamp-2 italic font-serif leading-relaxed mt-0.5">
                          "{item.text}"
                        </p>
                        <span className="text-[10px] font-mono text-vintage-400 mt-1">
                          Đã lưu lúc: {item.createdAt}
                        </span>
                      </div>

                      {/* History action button controls */}
                      <div className="flex items-center gap-1.5 self-end sm:self-center">
                        {/* Copy Source text button */}
                        <button
                          onClick={(e) => handleCopyText(item.text, item.id, e)}
                          className="p-2 bg-vintage-100 hover:bg-vintage-200 text-vintage-700 rounded-full transition-colors relative"
                          title="Sao chép văn bản nguồn"
                        >
                          {copiedId === item.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        
                        {/* Delete single history item */}
                        <button
                          onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                          className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-full transition-colors"
                          title="Xóa tệp khỏi nhật ký"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

          </div>

        </div>

      </div>

      {/* Elegant Poetic Footer */}
      <footer className="mt-16 text-center text-[11px] text-vintage-400 font-mono select-none">
        <p>© 2026 Lời Thời Gian • Bản Quyền Trọn Vẹn Thuộc Về Cảm Xúc Hoài Niệm</p>
        <p className="mt-1 text-vintage-300">Công nghệ dệt giọng nói thông minh hỗ trợ bởi Gemini Flash TTS</p>
      </footer>
    </div>
  );
}
