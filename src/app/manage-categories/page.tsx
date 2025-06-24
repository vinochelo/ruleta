
import CategoryManagement from '@/components/categories/CategoryManagement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'; // CardContent was missing
import { PencilRuler, Lightbulb } from 'lucide-react';
import AdBanner from '@/components/ads/AdBanner';

export default function ManageCategoriesPage() {
  return (
    <div className="space-y-8">
      <header className="mb-12">
        <h1 className="text-4xl font-bold title-text text-center mb-4">
          Gestionar Categorías y Palabras
        </h1>
        <p className="text-xl text-center text-foreground/80 max-w-2xl mx-auto">
          Aquí puedes añadir, editar o eliminar categorías y las palabras dentro de cada una para tu Ruleta Rupestre. ¡Personaliza tu juego al máximo!
        </p>
      </header>
      
      <CategoryManagement />

      <Card className="mt-12 bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="title-text flex items-center gap-2">
            <Lightbulb className="h-5 w-5" /> {/* Changed icon for variety */}
            Consejo Creativo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-foreground/70"> {/* Ensure CardDescription is used for text */}
            Intenta crear categorías variadas y palabras divertidas dentro de ellas. Piensa en temas específicos, abstractos o incluso ¡desafíos! Cuanta más variedad, más entretenido será el juego. No olvides añadir suficientes palabras a cada categoría.
          </CardDescription>
        </CardContent>
      </Card>
      
      <AdBanner slot="main" />
    </div>
  );
}
