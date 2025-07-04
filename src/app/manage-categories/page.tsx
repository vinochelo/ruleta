"use client";

import CategoryManagement from '@/components/categories/CategoryManagement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain } from 'lucide-react';

export default function ManageCategoriesPage() {
  return (
    <div className="space-y-8">
      <header className="mb-12">
        <h1 className="text-4xl font-bold title-text text-center mb-4">
          Gestionar Categorías y Palabras
        </h1>
        <p className="text-xl text-center text-foreground/80 max-w-3xl mx-auto">
          ¡Personaliza tu juego al máximo! Aquí puedes añadir, editar o eliminar categorías y las palabras dentro de cada una.
        </p>
      </header>
      
      <CategoryManagement />

      <Card className="mt-12 bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="title-text flex items-center gap-2">
            <Brain className="h-6 w-6" />
            ¡Aprovecha el poder de la IA!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-foreground/70 text-base space-y-2">
            <p>
              Crear listas de palabras puede ser tedioso, ¡pero no tiene por qué serlo! La Inteligencia Artificial está aquí para ayudarte.
            </p>
            <p>
              Simplemente escribe el nombre de la categoría que se te ocurra (p. ej., "Marcas de coches", "Superhéroes", "Postres famosos") y pulsa el botón de **"Añadir con IA"**. La IA generará una lista de palabras relevantes y listas para jugar en segundos. ¡Así de fácil!
            </p>
          </CardDescription>
        </CardContent>
      </Card>
      
    </div>
  );
}
