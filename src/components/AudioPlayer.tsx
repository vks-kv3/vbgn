import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, Download, Volume2, VolumeX, RotateCcw, Activity } from "lucide-react";

interface AudioPlayerProps {
  audioUrl: string | null;
  title: string;
  subtitle: string;
  onAudioEnded?: () => void;
}

export default function AudioPlayer({ audioUrl, title, subtitle, onAudioEnded }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLInputElement | null>(null);

  // Synchronize when audioUrl changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = audioUrl || "";
      audioRef.current.load();
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [audioUrl]);

  // Handle Playback Speed change
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, audioUrl]);

  const togglePlay = () => {
    if (!audioUrl || !audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => console.error("Playback failed", err));
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (onAudioEnded) onAudioEnded();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    setIsMuted(vol === 0);
    if (audioRef.current) {
      audioRef.current.volume = vol;
      audioRef.current.muted = vol === 0;
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    audioRef.current.muted = nextMute;
    if (nextMute) {
      audioRef.current.volume = 0;
    } else {
      audioRef.current.volume = volume;
    }
  };

  const restartAudio = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      if (!isPlaying) {
        audioRef.current.play().catch(err => console.error(err));
        setIsPlaying(true);
      }
    }
  };

  // Helper to format time (e.g., 01:23)
  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-vintage-100 border-2 border-vintage-300 rounded-3xl p-6 shadow-xl relative overflow-hidden" id="audio-player-card">
      {/* Background patterns */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-vintage-200/40 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-vintage-300/20 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>

      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleAudioEnded}
      />

      <div className="flex flex-col md:flex-row items-center gap-6 z-10 relative">
        {/* Dynamic Nostalgic Vinyl Record Player representation */}
        <div className="relative w-40 h-40 bg-vintage-800 rounded-2xl flex items-center justify-center shadow-lg border border-vintage-900 group">
          {/* Wooden framing accent */}
          <div className="absolute inset-1 rounded-xl border border-vintage-700 pointer-events-none"></div>

          {/* Vinyl Record */}
          <div
            className="w-32 h-32 rounded-full bg-stone-900 flex items-center justify-center relative shadow-inner ring-4 ring-stone-950 animate-spin-slow"
            style={{
              animationPlayState: isPlaying ? "running" : "paused",
            }}
          >
            {/* Vinyl Groves */}
            <div className="absolute inset-3 rounded-full border border-stone-800/40"></div>
            <div className="absolute inset-6 rounded-full border border-stone-800/50"></div>
            <div className="absolute inset-9 rounded-full border border-stone-800/40"></div>
            <div className="absolute inset-12 rounded-full border border-stone-800/60"></div>

            {/* Center Label */}
            <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-900 flex items-center justify-center relative">
              <div className="w-2.5 h-2.5 rounded-full bg-stone-950 shadow-inner"></div>
            </div>
          </div>

          {/* Phonograph Tonearm / Needle */}
          <div
            className="absolute top-2 right-4 w-12 h-20 origin-top-right transition-transform duration-700 ease-in-out pointer-events-none"
            style={{
              transform: isPlaying ? "rotate(-15deg)" : "rotate(-45deg)",
            }}
          >
            {/* Silver Needle Arm */}
            <div className="w-1 h-14 bg-stone-400 absolute right-2 top-2 origin-top rounded shadow-sm"></div>
            {/* Tone-head */}
            <div className="w-2.5 h-4 bg-vintage-600 rounded-sm absolute right-1.5 top-14 shadow-md border border-vintage-800"></div>
          </div>

          {/* Status Overlay */}
          {!audioUrl && (
            <div className="absolute inset-0 bg-vintage-950/80 rounded-2xl flex flex-col items-center justify-center text-vintage-300 text-xs text-center p-3">
              <Activity className="w-5 h-5 mb-1.5 animate-pulse text-vintage-400" />
              <span>Chưa có giọng nói</span>
            </div>
          )}
        </div>

        {/* Player Controls and Info */}
        <div className="flex-1 w-full flex flex-col justify-between">
          <div>
            <span className="inline-block bg-vintage-200 text-vintage-800 text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 rounded-full mb-1 border border-vintage-300/50">
              Giọng Nam Miền Bắc
            </span>
            <h3 className="font-serif font-semibold text-lg text-vintage-900 leading-tight line-clamp-1">{title}</h3>
            <p className="text-xs text-vintage-600 font-sans mt-0.5 line-clamp-1">{subtitle}</p>
          </div>

          {/* Progress Bar & Timing */}
          <div className="mt-4 w-full">
            <input
              type="range"
              ref={progressRef}
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              disabled={!audioUrl}
              className="w-full h-1.5 bg-vintage-200 rounded-lg appearance-none cursor-pointer accent-vintage-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
              style={{
                background: `linear-gradient(to right, #9b7e5a 0%, #9b7e5a ${(currentTime / (duration || 1)) * 100}%, #e8dfcc ${(currentTime / (duration || 1)) * 100}%, #e8dfcc 100%)`,
              }}
            />
            <div className="flex justify-between items-center text-[10px] font-mono text-vintage-600 mt-1.5">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Main Controls row */}
          <div className="flex items-center justify-between gap-2 mt-4">
            <div className="flex items-center gap-2">
              {/* Restart */}
              <button
                onClick={restartAudio}
                disabled={!audioUrl}
                className="p-2 rounded-full text-vintage-700 hover:bg-vintage-200/60 active:bg-vintage-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                title="Phát lại từ đầu"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Play / Pause */}
              <button
                onClick={togglePlay}
                disabled={!audioUrl}
                className="p-3.5 bg-vintage-700 hover:bg-vintage-800 text-vintage-50 rounded-full shadow-md active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title={isPlaying ? "Tạm dừng" : "Phát giọng nói"}
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>

              {/* Speed Selector */}
              <div className="flex items-center bg-vintage-200/50 border border-vintage-300 rounded-full px-2 py-0.5">
                <span className="text-[9px] font-mono text-vintage-600 mr-1">Tốc độ:</span>
                <select
                  value={playbackSpeed}
                  onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                  disabled={!audioUrl}
                  className="bg-transparent text-xs font-mono font-medium text-vintage-800 border-none focus:outline-none cursor-pointer"
                >
                  <option value="0.8">0.8x (Chậm)</option>
                  <option value="1.0">1.0x (Chuẩn)</option>
                  <option value="1.15">1.15x (Nhanh vừa)</option>
                  <option value="1.3">1.3x (Nhanh)</option>
                </select>
              </div>
            </div>

            {/* Download */}
            {audioUrl && (
              <a
                href={audioUrl}
                download={`${title.trim().replace(/\s+/g, "_")}_giong_mien_bac.wav`}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-vintage-600 hover:bg-vintage-700 text-vintage-50 font-medium rounded-full shadow-sm active:scale-95 transition-all"
                title="Tải tệp âm thanh WAV về máy"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tải về</span>
              </a>
            )}
          </div>

          {/* Volume control */}
          <div className="flex items-center gap-2 mt-3.5">
            <button
              onClick={toggleMute}
              disabled={!audioUrl}
              className="text-vintage-600 hover:text-vintage-800 disabled:opacity-40"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              disabled={!audioUrl}
              className="w-20 h-1 bg-vintage-200 rounded-lg appearance-none cursor-pointer accent-vintage-600 disabled:opacity-50"
              style={{
                background: `linear-gradient(to right, #9b7e5a 0%, #9b7e5a ${(isMuted ? 0 : volume) * 100}%, #e8dfcc ${(isMuted ? 0 : volume) * 100}%, #e8dfcc 100%)`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
