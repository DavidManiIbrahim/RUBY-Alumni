import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
  children: React.ReactNode;
  showFooter?: boolean;
}

export function Layout({ children, showFooter = true }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 relative z-10">
        {children}
      </main>
      <div className="fixed inset-0 z-0 pointer-events-none opacity-10">
        <div className="absolute inset-0 bg-[url('/doodle.webp')] bg-cover bg-center bg-no-repeat" />
      </div>
      {showFooter && <Footer />}
    </div>
  );
}
