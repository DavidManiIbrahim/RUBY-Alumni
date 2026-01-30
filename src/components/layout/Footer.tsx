import { GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-navy">
                {/* <GraduationCap className="h-6 w-6 text-gold" /> */}
                {/* <img src="/wchs logo-white.png" alt="logo" /> */}
              </div>
              <span className="font-display text-xl font-bold">AFCS</span>
            </Link>
            <p className="text-muted-foreground max-w-sm">
              AirForce Comprehensive yola Ex Airborne - Connecting alumni,
              building networks, and fostering lifelong friendships.
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
                  Join AFCS
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>AirForce Comprehensive School Yola</li>
              <li>info@wosa.org</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} AFCS. All rights reserved.</p>
          <p> Built by David Mani Ibrahim</p>
        </div>
      </div>
    </footer>
  );
}
