"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Gift, PlayCircle } from 'lucide-react';

interface ResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCategory: string | null;
  onStartPictionary: () => void;
}

const ResultsModal: React.FC<ResultsModalProps> = ({
  isOpen,
  onClose,
  selectedCategory,
  onStartPictionary,
}) => {
  if (!selectedCategory) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-card shadow-xl rounded-lg">
        <DialogHeader className="p-6">
          <DialogTitle className="flex items-center gap-2 text-2xl title-text">
            <Gift className="h-7 w-7 text-primary" />
            ¡Categoría Seleccionada!
          </DialogTitle>
          <DialogDescription className="text-muted-foreground pt-2">
            Prepárate para dibujar o actuar sobre:
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 py-8 text-center bg-primary/10 rounded-md m-6 mt-0">
          <p className="text-4xl font-bold text-primary">
            {selectedCategory}
          </p>
        </div>
        <DialogFooter className="p-6">
          <Button variant="outline" onClick={onClose} className="transition-transform hover:scale-105">
            Cerrar
          </Button>
          <Button onClick={onStartPictionary} className="transition-transform hover:scale-105">
            <PlayCircle className="mr-2 h-5 w-5" />
            Iniciar Pictionary
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ResultsModal;
