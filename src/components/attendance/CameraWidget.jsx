import React, { useRef, useState, useEffect } from 'react';

export function CameraWidget({
  onCapture,
  forceSimulator = false,
  'data-testid': testId = 'camera-widget',
  className = '',
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [isSimulator, setIsSimulator] = useState(forceSimulator);
  const [errorMessage, setErrorMessage] = useState('');
  const [simTime, setSimTime] = useState('');
  const [isFlashing, setIsFlashing] = useState(false);

  useEffect(() => {
    let mounted = true;

    if (forceSimulator) {
      setIsSimulator(true);
      return;
    }

    const initCamera = async () => {
      try {
        setErrorMessage('');
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new DOMException('getUserMedia not supported', 'NotSupportedError');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
        });

        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
          } catch {
            // Ignore auto-play rejection in test environments
          }
        }
        setIsSimulator(false);
      } catch (err) {
        if (!mounted) return;
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setErrorMessage('Izin kamera ditolak. Aktifkan izin kamera di browser Anda');
        } else if (err.name === 'NotReadableError') {
          setErrorMessage('Kamera sedang digunakan oleh aplikasi lain');
        } else {
          setErrorMessage('Gagal mengakses perangkat kamera');
        }
        setIsSimulator(true);
      }
    };

    initCamera();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [forceSimulator]);

  // Simulator clock ticker
  useEffect(() => {
    if (!isSimulator) return;
    const ticker = setInterval(() => {
      const now = new Date();
      setSimTime(now.toLocaleTimeString('id-ID'));
    }, 1000);
    return () => clearInterval(ticker);
  }, [isSimulator]);

  const handleShutter = () => {
    // 1. Trigger optical shutter flash pulse
    setIsFlashing(true);
    setTimeout(() => {
      setIsFlashing(false);
    }, 120);

    if (onCapture) {
      if (!isSimulator && videoRef.current) {
        onCapture(videoRef.current, false);
      } else {
        // Create rich offscreen simulated canvas frame
        const simCanvas = document.createElement('canvas');
        simCanvas.width = 640;
        simCanvas.height = 480;
        const ctx = simCanvas.getContext('2d');
        if (ctx) {
          // 1. Background Gradient (Dark Navy to Slate)
          const bgGrad = ctx.createLinearGradient(0, 0, 0, 480);
          bgGrad.addColorStop(0, '#0f172a');
          bgGrad.addColorStop(0.5, '#1e293b');
          bgGrad.addColorStop(1, '#090d16');
          ctx.fillStyle = bgGrad;
          ctx.fillRect(0, 0, 640, 480);

          // 2. Biometric Radar Reticle & Grid
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
          ctx.lineWidth = 1;
          for (let r = 80; r <= 220; r += 45) {
            ctx.beginPath();
            ctx.arc(320, 220, r, 0, Math.PI * 2);
            ctx.stroke();
          }
          // Crosshairs
          ctx.beginPath();
          ctx.moveTo(320, 20);
          ctx.lineTo(320, 420);
          ctx.moveTo(100, 220);
          ctx.lineTo(540, 220);
          ctx.stroke();

          // 3. Human Silhouette Avatar
          // Shoulders / Torso
          ctx.fillStyle = '#334155';
          ctx.beginPath();
          ctx.arc(320, 460, 140, Math.PI, 0);
          ctx.fill();

          // Lanyard & ID Badge
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(280, 330);
          ctx.lineTo(320, 390);
          ctx.lineTo(360, 330);
          ctx.stroke();

          // ID Badge Card
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(302, 385, 36, 48);
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(306, 390, 28, 8);
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(306, 404, 28, 3);
          ctx.fillRect(306, 411, 20, 3);

          // Neck
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(300, 260, 40, 70);

          // Head (Face)
          ctx.fillStyle = '#e2e8f0';
          ctx.beginPath();
          ctx.arc(320, 210, 60, 0, Math.PI * 2);
          ctx.fill();

          // Hair Silhouette
          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.arc(320, 195, 62, Math.PI, 0);
          ctx.fill();

          // Stylized Facial Features (Eyes & Smile)
          ctx.fillStyle = '#475569';
          ctx.beginPath();
          ctx.arc(302, 205, 5, 0, Math.PI * 2);
          ctx.arc(338, 205, 5, 0, Math.PI * 2);
          ctx.fill();

          // Smile
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(320, 220, 18, 0.2 * Math.PI, 0.8 * Math.PI);
          ctx.stroke();

          // 4. Monospace HUD & Contract Text
          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 24px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('[SIMULATED CAMERA VIEW]', 320, 240);

          ctx.font = '14px monospace';
          ctx.fillStyle = '#a5f3fc';
          ctx.fillText(`BIOMETRIC SCAN OK • ${simTime || new Date().toLocaleTimeString('id-ID')}`, 320, 275);
        }
        onCapture(simCanvas, true);
      }
    }
  };

  return (
    <div
      data-testid={testId}
      className={`camera-widget relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 ${className}`}
    >
      {/* Optical Shutter Flash Overlay */}
      {isFlashing && (
        <div
          data-testid="shutter-flash"
          className="absolute inset-0 bg-white z-50 pointer-events-none transition-opacity duration-100 opacity-90"
        />
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div
          role="alert"
          className="p-2.5 bg-amber-500/15 border-b border-amber-500/30 text-amber-300 text-xs text-center flex items-center justify-between px-4"
        >
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setIsSimulator(true)}
            data-testid="btn-enable-simulator"
            className="ml-2 px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 text-[11px] font-bold hover:bg-amber-500/40"
          >
            Gunakan Simulator Kamera
          </button>
        </div>
      )}

      {/* Simulator Mode Banner */}
      {isSimulator && (
        <div
          data-testid="simulator-banner"
          className="bg-indigo-600/80 text-white text-xs font-bold text-center py-1 tracking-wider uppercase backdrop-blur-sm"
        >
          Mode Simulator Aktif
        </div>
      )}

      {/* Video Viewport or Simulator Viewfinder */}
      <div className="relative aspect-[4/3] w-full flex items-center justify-center bg-slate-900 overflow-hidden">
        {!isSimulator ? (
          <video
            ref={videoRef}
            data-testid="camera-video-feed"
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />
        ) : (
          <div
            data-testid="camera-simulator-viewfinder"
            className="w-full h-full flex flex-col items-center justify-center relative p-4 text-center bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950"
          >
            {/* Viewfinder Reticle & Scanline */}
            <div className="w-48 h-48 rounded-full border-2 border-dashed border-sky-400/50 flex items-center justify-center relative overflow-hidden">
              <span className="text-4xl">👤</span>
              <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-sky-400" />
              <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-sky-400" />
              <div className="absolute bottom-2 left-2 w-3 h-2 border-b-2 border-l-2 border-sky-400" />
              <div className="absolute bottom-2 right-2 w-3 h-2 border-b-2 border-r-2 border-sky-400" />
              {/* Scanline beam */}
              <div
                data-testid="viewfinder-scanline"
                className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-sky-400 to-transparent shadow-[0_0_12px_#38bdf8] animate-pulse"
                style={{ top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
            <div className="mt-3 text-xs font-mono text-sky-400">{simTime || 'SIMULATOR LIVE'}</div>
            <p className="text-[11px] text-slate-400 mt-1">Arahkan wajah ke lingkaran panduan</p>
          </div>
        )}
      </div>

      {/* Camera Controls */}
      <div className="p-4 bg-slate-900/90 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={handleShutter}
          data-testid="btn-camera-shutter"
          className="min-h-[44px] px-6 py-2 rounded-full font-bold text-xs text-white bg-sky-500 hover:bg-sky-400 active:scale-95 shadow-glow transition-all flex items-center gap-2 cursor-pointer"
        >
          <span>📸</span>
          <span>Ambil Foto</span>
        </button>
      </div>
    </div>
  );
}

export default CameraWidget;
