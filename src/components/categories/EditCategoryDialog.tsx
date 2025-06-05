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
import { Label } from '@/components/ui/label';

interface Category {
  id: string;
  name: string;
}

interface EditCategoryDialogProps {
  category: Category;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedCategory: Category) => void;
}

const EditCategoryDialog: React.FC<EditCategoryDialogProps> = ({
  category,
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(category.name);

  useEffect(() => {
    setName(category.name);
  }, [category]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave({ ...category, name: name.trim() });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-card shadow-xl rounded-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="p-6">
            <DialogTitle className="title-text text-xl">Editar Categoría</DialogTitle>
            <DialogDescription className="text-muted-foreground pt-1">
              Modifica el nombre de la categoría seleccionada.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="categoryName" className="text-foreground">Nombre de la categoría</Label>
              <Input
                id="categoryName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-input"
                required
              />
            </div>
          </div>
          <DialogFooter className="p-6">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="transition-transform hover:scale-105">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" className="transition-transform hover:scale-105">Guardar Cambios</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditCategoryDialog;
