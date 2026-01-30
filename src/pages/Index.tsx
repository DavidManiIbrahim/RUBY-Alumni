import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import { Gem, Users, Megaphone, Award, ArrowRight, CheckCircle } from 'lucide-react';
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
      title: 'Global Network',
      description: 'Connect with elite alumni across the globe. Seamlessly build professional and personal bonds.',
    },
    {
      icon: Megaphone,
      title: 'Real-time Updates',
      description: 'Stay ahead with instant notifications on community events, milestones, and exclusive news.',
    },
    {
      icon: Gem,
      title: 'Elite Status',
      description: 'Celebrate your journey within the RUBY community. Showcase your legacy.',
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
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-background">
        <div className="absolute inset-0 bg-gradient-mesh opacity-30 animate-pulse-slow" />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(200,0,50,0.1),transparent_70%)]" />

        <div className="container relative z-10 py-24 lg:py-32">
          <div className="mx-auto max-w-4xl text-center animate-fade-in">
            <div className="mb-10 flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-ruby/20 bg-ruby/5 px-6 py-2 text-ruby-light backdrop-blur-sm animate-float">
                <Gem className="h-5 w-5" />
                <span className="text-sm font-bold tracking-widest uppercase">The RUBY Collective</span>
              </div>
            </div>

            <h1 className="font-display text-5xl font-black tracking-tighter sm:text-7xl lg:text-8xl mb-8">
              Legacy in <br />
              <span className="text-gradient-ruby">Every Facet</span>
            </h1>

            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
              Ascend to a new standard of connection. Reconnect with the
              distinguished alumni of the RUBY community.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button
                variant="default"
                size="xl"
                onClick={() => navigate('/auth?mode=signup')}
                className="group bg-gradient-ruby shadow-ruby hover:scale-105 transition-transform"
              >
                Start Your Journey
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button
                variant="outline"
                size="xl"
                onClick={() => navigate('/auth')}
                className="border-ruby/20 hover:bg-ruby/5"
              >
                Member Access
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-28">
        <div className="container">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl mb-4 text-foreground">
              Excellence Redefined
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Join the most distinguished network of RUBY alumni.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group p-8 rounded-2xl bg-card border border-border card-hover animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-ruby shadow-ruby">
                  <feature.icon className="h-7 w-7 text-white" />
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
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl mb-6 text-foreground">
                Unrivaled Connection
              </h2>
              <p className="text-muted-foreground mb-8">
                RUBY provides the framework for elite engagement,
                professional growth, and lasting legacy.
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
                  <div className="mx-auto mb-6 h-20 w-20 rounded-2xl bg-gradient-ruby shadow-ruby rotate-3 flex items-center justify-center">
                    <Gem className="h-10 w-10 text-white" />
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
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-5xl mb-6 text-white">
            Claim Your Legacy
          </h2>
          <p className="text-white/80 mb-10 max-w-xl mx-auto">
            Become a part of the RUBY lineage. Reconnect, reinvent, and lead.
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
