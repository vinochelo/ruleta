
"use client";

import { useState, useEffect, FormEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, PlusCircle, Brain } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface SuggestWordsDialogProps {
  categoryName: string;
  suggestedWords: string[];
  isOpen: boolean;
  onClose: () => void; // Standard close action
  onAddWords: (wordsToAdd: string[]) => void;
  isLoading?: boolean;
  onProcessingComplete?: () => void; // Called when dialog is fully done (added or cancelled)
}

const SuggestWordsDialog: React.FC<SuggestWordsDialogProps> = ({
  categoryName,
  suggestedWords,
  isOpen,
  onClose,
  onAddWords,
  isLoading = false,
  onProcessingComplete,
}) => {
  const [editableWords, setEditableWords] = useState<string[]>([]);
  const [newWord, setNewWord] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) { // Reset editable words when dialog opens with new suggestions
      setEditableWords([...suggestedWords]);
      setNewWord(''); // Clear manual input as well
    }
  }, [suggestedWords, isOpen]);

  const handleWordChange = (index: number, value: string) => {
    const updatedWords = [...editableWords];
    updatedWords[index] = value;
    setEditableWords(updatedWords);
  };

  const handleDeleteWord = (index: number) => {
    setEditableWords(editableWords.filter((_, i) => i !== index));
  };

  const handleAddManualWord = (e: FormEvent) => {
    e.preventDefault();
    if (newWord.trim() === '') {
      toast({ title: "Palabra Vacía", description: "No puedes añadir una palabra vacía.", variant: "destructive" });
      return;
    }
    if (editableWords.some(w => w.toLowerCase() === newWord.trim().toLowerCase())) {
      toast({ title: "Palabra Duplicada", description: "Esta palabra ya está en la lista.", variant: "destructive" });
      return;
    }
    setEditableWords([...editableWords, newWord.trim()]);
    setNewWord('');
  };

  const handleSubmitAndClose = () => {
    const finalWords = editableWords.filter(word => word.trim() !== '');
    if (finalWords.length === 0 && !isLoading) { //isLoading check to prevent premature toast if AI is still running
      toast({ title: "Sin Palabras", description: "No hay palabras para añadir.", variant: "destructive"});
      // Don't close or call processing complete if no words and not loading, let user add manually or cancel
      return;
    }
    if (finalWords.length > 0) {
      onAddWords(finalWords);
    }
    // onClose(); // This will be called by the DialogPrimitive.Close or onOpenChange
    onProcessingComplete?.();
  };

  const handleCancelAndClose = () => {
    // onClose(); // This will be called by the DialogPrimitive.Close or onOpenChange
    onProcessingComplete?.();
  };
  
  const handleDialogValidClose = (openStatus: boolean) => {
    if (!openStatus) { // Means dialog is attempting to close
        // If not explicitly handled by submit or cancel, treat as cancel for processing
        // This check ensures onProcessingComplete is called even if user clicks X or outside
        if (isOpen) { // Check if it was open before this change
             onProcessingComplete?.();
        }
        onClose(); // Call the original onClose to update parent's isOpen state
    } else {
        onClose(); // For opening, if managed by parent
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={handleDialogValidClose}>
      <DialogContent className="sm:max-w-lg bg-card shadow-xl rounded-lg">
        <DialogHeader className="p-6">
          <DialogTitle className="title-text text-xl flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Sugerencias para "{categoryName}"
          </DialogTitle>
          <DialogDescription className="text-muted-foreground pt-1">
            La IA ha sugerido estas palabras. Puedes editarlas, eliminarlas o añadir más antes de agregarlas a la categoría.
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="p-6 text-center min-h-[200px] flex flex-col justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Generando palabras...</p>
          </div>
        ) : (
          <>
            <ScrollArea className="h-72 p-6 pt-0">
              <div className="space-y-3">
                {editableWords.map((word, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={word}
                      onChange={(e) => handleWordChange(index, e.target.value)}
                      className="flex-grow bg-input"
                      aria-label={`Palabra editable ${index + 1}`}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteWord(index)}
                      className="text-destructive hover:text-red-700"
                      aria-label={`Eliminar palabra ${word}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {editableWords.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No se sugirieron palabras o se eliminaron todas. Puedes añadir manualmente.</p>
                )}
              </div>
            </ScrollArea>
            <div className="p-6 pt-2 border-t">
              <form onSubmit={handleAddManualWord} className="flex items-center gap-2">
                <Input
                  type="text"
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  placeholder="Añadir nueva palabra manualmente"
                  className="flex-grow bg-input"
                  aria-label="Añadir nueva palabra manualmente"
                />
                <Button type="submit" variant="outline" size="icon" aria-label="Añadir palabra manual">
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        )}

        <DialogFooter className="p-6">
          {/* DialogClose will trigger onOpenChange, which calls handleDialogValidClose -> onProcessingComplete */}
          <DialogClose asChild> 
            <Button type="button" variant="outline" className="transition-transform hover:scale-105">
              Cancelar
            </Button>
          </DialogClose>
          <Button 
            onClick={handleSubmitAndClose} 
            className="transition-transform hover:scale-105" 
            disabled={isLoading || (editableWords.filter(w => w.trim() !== '').length === 0 && !isLoading)}
          >
            Añadir Palabras ({editableWords.filter(w => w.trim() !== '').length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SuggestWordsDialog;

