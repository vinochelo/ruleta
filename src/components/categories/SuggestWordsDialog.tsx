
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
  const { toast } = useToast();

  const lowerCaseDuplicates = useMemo(() => new Set(duplicateWords.map(w => w.toLowerCase())), [duplicateWords]);

  useEffect(() => {
    if (isOpen && !isLoading) {
      setEditableWords([...suggestedWords]);
      setNewWord('');
    }
  }, [suggestedWords, isOpen, isLoading]);

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
    const wordToAdd = newWord.trim();
    if (wordToAdd === '') {
      toast({ title: "Palabra Vacía", description: "No puedes añadir una palabra vacía.", variant: "destructive" });
      return;
    }
    if (editableWords.some(w => w.toLowerCase() === wordToAdd.toLowerCase())) {
      toast({ title: "Palabra Duplicada", description: "Esta palabra ya está en la lista.", variant: "default" });
      return;
    }
    setEditableWords([wordToAdd, ...editableWords]); // Add to the top for visibility
    setNewWord('');
  };

  const handleSubmit = () => {
    const finalWords = editableWords
      .map(w => w.trim())
      .filter(w => w !== '' && !lowerCaseDuplicates.has(w.toLowerCase()));

    const uniqueWords = [...new Set(finalWords.map(w => w.toLowerCase()))];
    if (finalWords.length !== uniqueWords.length) {
      toast({ title: "Palabras Duplicadas", description: "La lista final contiene palabras duplicadas que has introducido manualmente. Por favor, revísala.", variant: "destructive" });
      return;
    }

    if (finalWords.length === 0) {
      toast({ title: "Sin Palabras Nuevas", description: "No hay palabras nuevas para añadir.", variant: "destructive"});
      return;
    }
    
    onAddWords(finalWords);
  };
  
  const wordsToAddCount = useMemo(() => {
    return editableWords.filter(w => w.trim() !== '' && !lowerCaseDuplicates.has(w.toLowerCase())).length;
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
                  const isDuplicate = lowerCaseDuplicates.has(word.toLowerCase());
                  return (
                    <div key={index} className="flex items-center gap-2 animate-in fade-in duration-300">
                      <Input
                        value={word}
                        onChange={(e) => handleWordChange(index, e.target.value)}
                        className={cn(
                            "flex-grow bg-input/50",
                            isDuplicate && "border-amber-500/50 text-muted-foreground line-through focus-visible:ring-amber-500"
                        )}
                        aria-label={`Palabra editable ${index + 1}`}
                        readOnly={isDuplicate}
                      />
                      {isDuplicate && (
                        <Badge variant="outline" className="border-amber-500 text-amber-600 shrink-0">Duplicada</Badge>
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
            disabled={isLoading || wordsToAddCount === 0}
          >
            Añadir Palabras Nuevas ({wordsToAddCount})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SuggestWordsDialog;
