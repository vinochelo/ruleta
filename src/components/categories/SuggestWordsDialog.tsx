
"use client";

import { useState, useEffect, FormEvent, useMemo } from 'react';
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
import { X, PlusCircle, Brain, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface SuggestWordsDialogProps {
  categoryName: string;
  suggestedWords: string[];
  duplicateWords?: string[];
  isOpen: boolean;
  onClose: () => void;
  onAddWords: (wordsToAdd: string[]) => void;
  isLoading?: boolean;
}

const SuggestWordsDialog: React.FC<SuggestWordsDialogProps> = ({
  categoryName,
  suggestedWords,
  duplicateWords = [],
  isOpen,
  onClose,
  onAddWords,
  isLoading = false,
}) => {
  const [editableWords, setEditableWords] = useState<string[]>([]);
  const [newWord, setNewWord] = useState('');
  const [manualDuplicates, setManualDuplicates] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const lowerCaseDuplicates = useMemo(() => new Set(duplicateWords.map(w => w.toLowerCase())), [duplicateWords]);

  useEffect(() => {
    if (isOpen) {
      if (!isLoading) {
        setEditableWords([...suggestedWords]);
        setNewWord('');
      }
      // Reset manual duplicate highlights whenever the dialog is opened or re-evaluated
      setManualDuplicates(new Set());
    }
  }, [suggestedWords, isOpen, isLoading]);

  const handleWordChange = (index: number, value: string) => {
    const updatedWords = [...editableWords];
    updatedWords[index] = value;
    setEditableWords(updatedWords);
    // Clear highlights when user starts editing, as they might be fixing it
    if (manualDuplicates.size > 0) {
      setManualDuplicates(new Set());
    }
  };

  const handleDeleteWord = (index: number) => {
    setEditableWords(editableWords.filter((_, i) => i !== index));
    if (manualDuplicates.size > 0) {
      setManualDuplicates(new Set());
    }
  };

  const handleAddManualWord = (e: FormEvent) => {
    e.preventDefault();
    const wordToAdd = newWord.trim();
    if (wordToAdd === '') {
      toast({ title: "Palabra Vacía", description: "No puedes añadir una palabra vacía.", variant: "destructive" });
      return;
    }
    if (editableWords.some(w => w.toLowerCase() === wordToAdd.toLowerCase())) {
      toast({ title: "Palabra Duplicada", description: "Esta palabra ya está en la lista.", variant: "default" });
      return;
    }
    if (manualDuplicates.size > 0) {
      setManualDuplicates(new Set());
    }
    setEditableWords([wordToAdd, ...editableWords]); // Add to the top for visibility
    setNewWord('');
  };

  const handleSubmit = () => {
    // 1. Check for duplicates within the editable list
    const seenWords = new Map<string, number>();
    const wordsWithDuplicates = new Set<string>();

    editableWords.forEach((word) => {
      const lowerCaseWord = word.trim().toLowerCase();
      if (lowerCaseWord) {
        seenWords.set(lowerCaseWord, (seenWords.get(lowerCaseWord) || 0) + 1);
      }
    });

    seenWords.forEach((count, word) => {
      if (count > 1) {
        wordsWithDuplicates.add(word);
      }
    });

    if (wordsWithDuplicates.size > 0) {
      const duplicateNames = [...wordsWithDuplicates].map(w => `"${w}"`).join(', ');
      toast({
        title: "Palabras Repetidas",
        description: `Se encontraron repeticiones para: ${duplicateNames}. Por favor, elimina las copias.`,
        variant: "destructive",
      });
      setManualDuplicates(wordsWithDuplicates); // Highlight them
      return;
    }
    
    setManualDuplicates(new Set()); // Clear any previous highlights

    // 2. Prepare final list, filtering out original duplicates and empty strings
    const finalWords = editableWords
      .map(w => w.trim())
      .filter(w => w !== '' && !lowerCaseDuplicates.has(w.toLowerCase()));
    
    // Create a final unique set to be safe
    const uniqueFinalWords = [...new Set(finalWords)];

    if (uniqueFinalWords.length === 0) {
      toast({ title: "Sin Palabras Nuevas", description: "No hay palabras nuevas para añadir.", variant: "default" });
      return;
    }
    
    onAddWords(uniqueFinalWords);
  };
  
  const wordsToAddCount = useMemo(() => {
    return editableWords.filter(w => {
      const lowerCaseWord = w.trim().toLowerCase();
      return lowerCaseWord !== '' && !lowerCaseDuplicates.has(lowerCaseWord);
    }).length;
  }, [editableWords, lowerCaseDuplicates]);


  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!isLoading) onClose(); }}>
      <DialogContent className="sm:max-w-lg bg-card shadow-xl rounded-lg">
        <DialogHeader className="p-6">
          <DialogTitle className="title-text text-xl flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Sugerencias para "{categoryName}"
          </DialogTitle>
          <DialogDescription className="text-muted-foreground pt-1">
            Edita, elimina o añade palabras. Las duplicadas están marcadas y no se añadirán.
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="p-6 text-center min-h-[350px] flex flex-col justify-center items-center">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">Buscando sugerencias de la IA...</p>
          </div>
        ) : (
          <>
            <div className="px-6 pt-0">
              <form onSubmit={handleAddManualWord} className="flex items-center gap-2">
                <Input
                  type="text"
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  placeholder="Añadir palabra manualmente..."
                  className="flex-grow bg-input"
                  aria-label="Añadir nueva palabra manualmente"
                />
                <Button type="submit" variant="outline" size="icon" aria-label="Añadir palabra manual">
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </form>
            </div>
            <ScrollArea className="h-72 px-6 py-4">
              <div className="space-y-3">
                {editableWords.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-10">No se sugirieron palabras. Añade algunas manualmente.</p>
                )}
                {editableWords.map((word, index) => {
                  const lowerCaseWord = word.trim().toLowerCase();
                  const isOriginalDuplicate = lowerCaseDuplicates.has(lowerCaseWord);
                  const isManualDuplicate = manualDuplicates.has(lowerCaseWord);
                  return (
                    <div key={index} className="flex items-center gap-2 animate-in fade-in duration-300">
                      <Input
                        value={word}
                        onChange={(e) => handleWordChange(index, e.target.value)}
                        className={cn(
                            "flex-grow bg-input/50",
                            isOriginalDuplicate && "border-amber-500/50 text-muted-foreground line-through focus-visible:ring-amber-500",
                            isManualDuplicate && !isOriginalDuplicate && "border-destructive/80 focus-visible:ring-destructive"
                        )}
                        aria-label={`Palabra editable ${index + 1}`}
                        readOnly={isOriginalDuplicate}
                      />
                      {isOriginalDuplicate && (
                        <Badge variant="outline" className="border-amber-500 text-amber-600 shrink-0">Duplicada</Badge>
                      )}
                       {isManualDuplicate && !isOriginalDuplicate && (
                        <Badge variant="destructive" className="shrink-0">Repetida</Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteWord(index)}
                        className="text-destructive/70 hover:text-destructive hover:bg-destructive/10 shrink-0"
                        aria-label={`Eliminar palabra ${word}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </>
        )}

        <DialogFooter className="p-6 pt-2 border-t">
          <DialogClose asChild> 
            <Button type="button" variant="outline" className="transition-transform hover:scale-105" disabled={isLoading}>
              Cancelar
            </Button>
          </DialogClose>
          <Button 
            onClick={handleSubmit} 
            className="transition-transform hover:scale-105" 
            disabled={isLoading || (wordsToAddCount === 0 && editableWords.length > 0)}
          >
            Añadir Palabras Nuevas ({wordsToAddCount})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SuggestWordsDialog;
