import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Users, Megaphone, Award, ArrowRight, CheckCircle } from 'lucide-react';
import { useEffect } from 'react';

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const features = [
    {
      icon: Users,
      title: 'Connect with Alumni',
      description: 'Find and connect with fellow graduates from all years. Build lasting professional and personal networks.',
    },
    {
      icon: Megaphone,
      title: 'Stay Informed',
      description: 'Get the latest news, events, and announcements from the AFCS community and school.',
    },
    {
      icon: Award,
      title: 'Celebrate Success',
      description: 'Share achievements and milestones with your Ex Airborne. Inspire the next generation.',
    },
  ];

  const benefits = [
    'Access to exclusive alumni directory',
    'Networking opportunities with fellow graduates',
    'Latest news and announcements',
    'Profile showcasing your achievements',
    'Connect by graduation year',
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
        <div className="absolute inset-0 bg-primary/5 bg-cover bg-transparent  bg-center opacity-50" />

        <div className="container relative py-24 lg:py-32">
          <div className="mx-auto max-w-3xl text-center animate-fade-in">
            <div className="mb-8 flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-gold/20 px-4 py-2 text-gold">
                <GraduationCap className="h-5 w-5" />
                <span className="text-sm font-medium">AirForce Comprehensive yola Ex Airborne</span>
              </div>
            </div>

            <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl mb-6 dark:text-white">
              Welcome to{' '}
              <span className="text-gradient-gold">AFCS</span>
            </h1>

            <p className="text-lg text-primary-foreground/80 mb-8 max-w-2xl mx-auto dark:text-white">
              Reconnect with old friends, build new relationships, and stay connected
              with the AirForce Comprehensive School Yola community.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="hero"
                size="xl"
                onClick={() => navigate('/auth?mode=signup')}
                className="group"
              >
                Join AFCS Today
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button
                variant="heroOutline"
                size="xl"
                onClick={() => navigate('/auth')}
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>

        {/* Decorative bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="hsl(var(--background))" />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-28">
        <div className="container">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl mb-4 dark:text-foreground">
              Why Join AFCS?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto dark:text-foreground/80">
              Be part of a thriving community of AirForce Comprehensive School Yola alumni
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group p-8 rounded-2xl bg-card border border-border card-hover animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-gold shadow-gold">
                  <feature.icon className="h-7 w-7 text-navy-dark" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-3 dark:text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground dark:text-foreground/80">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 lg:py-28 bg-muted/50">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl mb-6 dark:text-foreground">
                Everything you need to stay connected
              </h2>
              <p className="text-muted-foreground mb-8 dark:text-foreground/80">
                AFCS provides a comprehensive platform for alumni to maintain connections,
                share experiences, and contribute to the school community.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-3 animate-slide-in-right dark:text-foreground"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative animate-fade-in">
              <div className="absolute inset-0 bg-gradient-gold rounded-3xl opacity-20 blur-3xl" />
              <div className="relative bg-card rounded-3xl border border-border p-8 shadow-elevated">
                <div className="text-center">
                  <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-gradient-navy flex items-center justify-center">
                    <GraduationCap className="h-10 w-10 text-gold" />
                  </div>
                  <h3 className="font-display text-2xl font-bold mb-2 dark:text-foreground">Ready to join?</h3>
                  <p className="text-muted-foreground mb-6 dark:text-foreground/80">
                    Create your profile and connect with fellow alumni today.
                  </p>
                  <Button
                    variant="gold"
                    size="lg"
                    className="w-full"
                    onClick={() => navigate('/auth?mode=signup')}
                  >
                    Get Started
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28 bg-gradient-navy text-primary-foreground">
        <div className="container text-center ">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl mb-4  dark:text-white">
            Join the AFCS Community
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto dark:text-white">
            Be part of a network of successful alumni. Register today and reconnect
            with your school community.
          </p>
          <Button
            variant="hero"
            size="xl"
            onClick={() => navigate('/auth?mode=signup')}
          >
            Register Now
          </Button>
        </div>
      </section>
    </Layout>
  );
}
