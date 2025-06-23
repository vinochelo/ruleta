
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Pause, RotateCcw, TimerIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const [isFinished, setIsFinished] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  
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

  // Effect to handle side-effects of time changes (end of timer, beeps, animations)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (timeLeft === 0 && isRunning) {
      playTimerEndSound();
      onTimerEnd();
      setIsRunning(false); // Stop the timer
      setIsFinished(true);
    } else if (timeLeft > 0 && isRunning) {
      if (timeLeft <= 10) {
        playBeep();
      }
      if (timeLeft % 10 === 0) {
        setIsPulsing(true);
        timeoutId = setTimeout(() => setIsPulsing(false), 400); // Animation is 0.4s long
      }
    }
    return () => clearTimeout(timeoutId); // Cleanup timeout on effect re-run
  }, [timeLeft, isRunning, onTimerEnd]);


  const handleStartPause = useCallback(() => {
    // If timer is over, this button acts as a restart
    if (timeLeft <= 0) { 
        setIsFinished(false);
        setTimeLeft(initialDuration);
        setIsRunning(true); 
    } else {
        setIsRunning((prev) => !prev);
    }
  }, [timeLeft, initialDuration]);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(initialDuration);
    setIsFinished(false);
  }, [initialDuration]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  const timeContainerClass = cn(
    'text-7xl sm:text-9xl font-mono font-bold tabular-nums py-4 rounded-md transition-colors flex justify-center items-center',
    isPulsing && 'timer-tick-pulse-animation',
    {
      'text-primary': !isFinished && (timeLeft > 10 || !isRunning),
      'text-destructive timer-pulse-warning-animation': timeLeft <= 10 && timeLeft > 0 && isRunning,
      'text-destructive': isFinished,
      'text-muted-foreground': timeLeft === 0 && !isFinished,
    }
  );

  return (
    <Card className="w-full max-w-md mx-auto text-center shadow-lg transform transition-all duration-300 hover:shadow-xl">
      <CardHeader>
        <CardTitle className="title-text text-2xl flex items-center justify-center gap-2">
          <TimerIcon className="h-6 w-6" />
          Tiempo Restante
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className={timeContainerClass}>
          {isFinished ? (
            formatTime(timeLeft).split('').map((char, index) => (
              <span
                key={`${char}-${index}`}
                className="timer-end-flip-animation"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {char}
              </span>
            ))
          ) : (
            <span>{formatTime(timeLeft)}</span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button onClick={handleStartPause} className="w-full transition-transform hover:scale-105" size="lg">
            <div className="flex items-center justify-center">
              {isRunning ? <Pause className="mr-2 h-6 w-6" /> : <Play className="mr-2 h-6 w-6" />}
              <span className="text-xl">{isRunning ? 'Pausar' : (timeLeft > 0 ? 'Iniciar' : 'Reiniciar')}</span>
            </div>
          </Button>
          <Button onClick={handleReset} variant="outline" className="w-full transition-transform hover:scale-105" size="lg" disabled={timeLeft === initialDuration && !isRunning}>
            <div className="flex items-center justify-center">
              <RotateCcw className="mr-2 h-6 w-6" />
              <span className="text-xl">Resetear</span>
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Timer;
