import { Gem } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-6 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-ruby shadow-ruby rotate-3 group-hover:rotate-0 transition-transform duration-300">
                <Gem className="h-6 w-6 text-white" />
              </div>
              <span className="font-display text-2xl font-black text-gradient-ruby tracking-tighter">RUBY</span>
            </Link>
            <p className="text-muted-foreground max-w-sm leading-relaxed">
              The RUBY Alumni Network - Where industry leaders and distinguished
              graduates connect to build a lasting legacy.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/directory" className="hover:text-foreground transition-colors">
                  Alumni Directory
                </Link>
              </li>
              <li>
                <Link to="/announcements" className="hover:text-foreground transition-colors">
                  Announcements
                </Link>
              </li>
              <li>
                <Link to="/auth" className="hover:text-foreground transition-colors">
                  Join The Collective
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>The RUBY Collective</li>
              <li>concierge@ruby-network.com</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} RUBY Network. All rights reserved.</p>
          <p> Built by David Mani Ibrahim</p>
        </div>
      </div>
    </footer>
  );
}
