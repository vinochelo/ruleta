
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Pause, RotateCcw, TimerIcon } from 'lucide-react';

const playBeep = () => {
  if (typeof window !== 'undefined' && window.AudioContext) {
    const audioContext = new window.AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.1);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);

    oscillator.onended = () => {
      audioContext.close().catch(console.error);
    };
  }
};

const playTimerEndSound = () => {
  if (typeof window !== 'undefined' && window.AudioContext) {
    const audioContext = new window.AudioContext();
    const gainNode = audioContext.createGain();
    // Increased gain for a louder sound
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    gainNode.connect(audioContext.destination);

    const playTone = (freq: number, time: number, duration: number) => {
        const oscillator = audioContext.createOscillator();
        // Sawtooth is a more "buzzy" and attention-grabbing sound
        oscillator.type = 'sawtooth'; 
        oscillator.frequency.setValueAtTime(freq, time);
        oscillator.connect(gainNode);
        oscillator.start(time);
        oscillator.stop(time + duration);
    };

    const now = audioContext.currentTime;
    // Two quick, high-pitched beeps
    playTone(1200, now, 0.1);
    playTone(1200, now + 0.15, 0.2);

    const totalDuration = 0.15 + 0.2;
    setTimeout(() => {
        audioContext.close().catch(console.error);
    }, totalDuration * 1000 + 200);
  }
};

export interface TimerProps {
  initialDuration: number;
  onTimerEnd: () => void;
  autoStart?: boolean;
}

const Timer: React.FC<TimerProps> = ({ initialDuration, onTimerEnd, autoStart = false }) => {
  const [timeLeft, setTimeLeft] = useState(initialDuration);
  const [isRunning, setIsRunning] = useState(autoStart);
  
  // Effect to handle the countdown interval
  useEffect(() => {
    if (!isRunning) {
      return;
    }
    const intervalId = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(intervalId);
  }, [isRunning]);

  // Effect to handle side-effects of time changes (end of timer, beeps)
  useEffect(() => {
    if (timeLeft === 0 && isRunning) {
      playTimerEndSound();
      onTimerEnd();
      setIsRunning(false); // Stop the timer
    } else if (timeLeft > 0 && timeLeft <= 10 && isRunning) {
      playBeep();
    }
  }, [timeLeft, isRunning, onTimerEnd]);


  const handleStartPause = useCallback(() => {
    if (timeLeft <= 0) { 
        setTimeLeft(initialDuration);
        setIsRunning(true); 
    } else {
        setIsRunning((prev) => !prev);
    }
  }, [timeLeft, initialDuration]);

  const handleReset = useCallback(() => {
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
      <CardHeader>
        <CardTitle className="title-text text-2xl flex items-center justify-center gap-2">
          <TimerIcon className="h-6 w-6" />
          Tiempo Restante
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className={`text-9xl font-mono font-bold tabular-nums py-4 rounded-md
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
