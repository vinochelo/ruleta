"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Pause, RotateCcw, TimerIcon } from 'lucide-react';

interface TimerProps {
  initialDuration: number; // in seconds
  onTimerEnd: () => void;
  autoStart?: boolean;
}

const Timer: React.FC<TimerProps> = ({ initialDuration, onTimerEnd, autoStart = false }) => {
  const [timeLeft, setTimeLeft] = useState(initialDuration);
  const [isRunning, setIsRunning] = useState(autoStart);

  useEffect(() => {
    setTimeLeft(initialDuration);
    setIsRunning(autoStart);
  }, [initialDuration, autoStart]);

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) {
      if (timeLeft <= 0 && isRunning) { // ensure onTimerEnd is called only once when timer reaches 0
        onTimerEnd();
        setIsRunning(false); 
      }
      return;
    }

    const intervalId = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isRunning, timeLeft, onTimerEnd]);

  const handleStartPause = useCallback(() => {
    if (timeLeft <= 0) { // If timer ended, reset and start
        setTimeLeft(initialDuration);
    }
    setIsRunning((prev) => !prev);
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
        <div className={`text-6xl font-mono font-bold tabular-nums py-4 rounded-md
          ${timeLeft <= 10 && timeLeft > 0 && isRunning ? 'text-destructive animate-pulse' : 'text-primary'}
          ${timeLeft === 0 ? 'text-muted-foreground' : ''}
        `}>
          {formatTime(timeLeft)}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button onClick={handleStartPause} className="w-full text-md py-3 transition-transform hover:scale-105" size="lg">
            {isRunning ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? 'Pausar' : (timeLeft <= 0 ? 'Reiniciar Juego' : 'Iniciar')}
          </Button>
          <Button onClick={handleReset} variant="outline" className="w-full text-md py-3 transition-transform hover:scale-105" size="lg" disabled={timeLeft === initialDuration && !isRunning}>
            <RotateCcw className="mr-2 h-5 w-5" />
            Resetear
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Timer;
