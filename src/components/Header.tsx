
import Link from 'next/link';
import { Gamepad2, ListChecks } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-card/80 backdrop-blur-md shadow-md sticky top-0 z-50">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Invisible spacer to balance the nav on the right, for centering the title */}
          <div className="flex items-center gap-4 invisible" aria-hidden="true">
            <Link href="/" className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Gamepad2 className="h-4 w-4" />
              <span className="hidden sm:inline">Jugar</span>
            </Link>
            <Link href="/manage-categories" className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <ListChecks className="h-4 w-4" />
              <span className="hidden sm:inline">Categorías</span>
            </Link>
          </div>

          <Link href="/" className="flex items-center gap-2">
            <Gamepad2 className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
            <h1 className="text-xl sm:text-2xl font-bold text-primary whitespace-nowrap">Ruleta Pictionary</h1>
          </Link>
          
          <nav className="flex items-center gap-4">
            <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
              <Gamepad2 className="h-4 w-4" />
              <span className="hidden sm:inline">Jugar</span>
            </Link>
            <Link href="/manage-categories" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
              <ListChecks className="h-4 w-4" />
              <span className="hidden sm:inline">Categorías</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
