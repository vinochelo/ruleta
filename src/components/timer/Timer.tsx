
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Pause, RotateCcw, TimerIcon } from 'lucide-react';

const playBeep = () => {
  if (typeof window !== 'undefined' && window.AudioContext) {
    const audioContext = new window.AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = 'square'; // Changed to a more "retro game" sound
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4 note, less shrill
    gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.1);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);

    oscillator.onended = () => {
      audioContext.close().catch(console.error); // Clean up context
    };
  }
};

const Timer: React.FC<TimerProps> = ({ initialDuration, onTimerEnd, autoStart = false }) => {
  const [timeLeft, setTimeLeft] = useState(initialDuration);
  const [isRunning, setIsRunning] = useState(autoStart);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const timerEndSoundRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    setTimeLeft(initialDuration);
    setIsRunning(autoStart);
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDuration, autoStart]); 

  useEffect(() => {
    if (!isRunning) {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
      return;
    }

    if (timeLeft <= 0) {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
      onTimerEnd();
      timerEndSoundRef.current?.play().catch(console.error);
      return;
    }

    intervalIdRef.current = setInterval(() => {
      setTimeLeft((prevTime) => {
        const newTime = prevTime - 1;
        if (newTime <= 0) {
          if (intervalIdRef.current) clearInterval(intervalIdRef.current);
        } else if (newTime <= 10) { // Beep in the last 10 seconds
          playBeep();
        }
        return newTime;
      });
    }, 1000);

    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, timeLeft]); 


  const handleStartPause = useCallback(() => {
    if (timeLeft <= 0) { 
        setTimeLeft(initialDuration);
        setIsRunning(true); 
    } else {
        setIsRunning((prev) => !prev);
    }
  }, [timeLeft, initialDuration]);

  const handleReset = useCallback(() => {
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
    setIsRunning(false);
    setTimeLeft(initialDuration);
  }, [initialDuration]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  return (
    <Card className="w-full max-w-sm mx-auto text-center shadow-lg transform transition-all duration-300 hover:shadow-xl">
      <audio
        ref={timerEndSoundRef}
        src="https://cdn.pixabay.com/download/audio/2022/03/13/audio_2c8a3d671e.mp3?filename=game-over-arcade-6435.mp3"
        preload="auto"
      />
      <CardHeader>
        <CardTitle className="title-text text-2xl flex items-center justify-center gap-2">
          <TimerIcon className="h-6 w-6" />
          Tiempo Restante
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className={`text-8xl font-mono font-bold tabular-nums py-4 rounded-md
          ${timeLeft <= 10 && timeLeft > 0 && isRunning ? 'text-destructive animate-pulse' : 'text-primary'}
          ${timeLeft === 0 ? 'text-muted-foreground' : ''}
        `}>
          {formatTime(timeLeft)}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button onClick={handleStartPause} className="w-full text-md py-3 transition-transform hover:scale-105" size="lg" disabled={timeLeft <=0 && !isRunning}>
            {isRunning ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? 'Pausar' : (timeLeft <= 0 ? 'Finalizado' : 'Iniciar')}
          </Button>
          <Button onClick={handleReset} variant="outline" className="w-full text-md py-3 transition-transform hover:scale-105" size="lg" disabled={(timeLeft === initialDuration && !isRunning) || (timeLeft <= 0 && !isRunning)}>
            <RotateCcw className="mr-2 h-5 w-5" />
            Resetear
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Timer;



