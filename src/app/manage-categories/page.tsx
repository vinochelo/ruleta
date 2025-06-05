import CategoryManagement from '@/components/categories/CategoryManagement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PencilRuler } from 'lucide-react';

export default function ManageCategoriesPage() {
  return (
    <div className="space-y-8">
      <header className="mb-12">
        <h1 className="text-4xl font-bold title-text text-center mb-4">
          Gestionar Categorías
        </h1>
        <p className="text-xl text-center text-foreground/80 max-w-2xl mx-auto">
          Aquí puedes añadir, editar o eliminar las categorías que aparecerán en la Ruleta Rupestre. ¡Personaliza tu juego!
        </p>
      </header>
      
      <CategoryManagement />

      <Card className="mt-12 bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="title-text flex items-center gap-2">
            <PencilRuler className="h-5 w-5" />
            Consejo Creativo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription>
            Intenta crear categorías variadas y divertidas. Piensa en temas específicos, abstractos o incluso ¡desafíos! Cuanta más variedad, más entretenido será el juego.
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}
