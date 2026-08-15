import { type FormEvent, type ReactNode, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ArrowRight, ArrowUpRight, Check, Compass, Menu, Rocket, ScanSearch, ShieldCheck, X } from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import AdminLogin from '@/pages/admin-login';
import AdminDashboard from '@/pages/admin-dashboard';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import logoPath from '@assets/maruthi-enterprises-logo-transparent.png';
import { api, ApiError } from '@/lib/api';

const contactEmail = 'maruthienterprises00777@gmail.com';

const queryClient = new QueryClient();

type FormValues = {
  fullName: string;
  email: string;
  contact: string;
  industry: string;
  title: string;
  description: string;
  resources: string;
};

const blankForm: FormValues = {
  fullName: '',
  email: '',
  contact: '',
  industry: '',
  title: '',
  description: '',
  resources: '',
};

const navItems = [
  { label: 'Process', href: '#process' },
  { label: 'About', href: '#about' },
  { label: 'Our thinking', href: '#thinking' },
];

function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [form, setForm] = useState<FormValues>(blankForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Honeypot: real visitors never see or fill this field. Left blank on a
  // legitimate submission; the backend rejects the request if it's filled in.
  const [honeypot, setHoneypot] = useState('');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMenu = () => setMenuOpen(false);
  const updateField = (field: keyof FormValues, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validate = () => {
    const nextErrors: Partial<Record<keyof FormValues, string>> = {};
    const required: Array<[keyof FormValues, string]> = [
      ['fullName', 'Tell us who is behind the idea.'],
      ['email', 'Add an email so we can reach you.'],
      ['contact', 'A contact number helps us follow up.'],
      ['industry', 'Choose the closest industry.'],
      ['title', 'Give your idea a working title.'],
      ['description', 'A little detail helps us understand the opportunity.'],
      ['resources', 'Tell us what would move you forward.'],
    ];
    required.forEach(([key, message]) => {
      if (!form[key].trim()) nextErrors[key] = message;
    });
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = 'Please check the email format.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    if (!validate()) return;
    if (honeypot) return; // silently drop likely-bot submissions

    setIsSubmitting(true);
    try {
      await api.post('/api/submissions', {
        fullName: form.fullName,
        email: form.email,
        contact: form.contact,
        industry: form.industry,
        title: form.title,
        description: form.description,
        resources: form.resources,
        website: honeypot,
      });
      setSubmitted(true);
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors) {
        setErrors(error.fieldErrors as Partial<Record<keyof FormValues, string>>);
      }
      setSubmitError(
        error instanceof ApiError
          ? error.message
          : "We couldn't submit your idea right now. Please try again in a few minutes.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setForm(blankForm);
    setErrors({});
    setSubmitError(null);
  };

  return (
    <main className="site-shell">
      <header className={`topbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="container nav-inner">
          <a href="#home" className="brand-lockup" data-testid="link-brand-home" onClick={closeMenu}>
            <img src={logoPath} alt="Maruthi Enterprises" className="brand-mark" data-testid="img-brand-logo" />
            <span className="brand-type">
              <span className="brand-name">Maruthi Catalyst</span>
              <span className="brand-sub">by Maruthi Enterprises</span>
            </span>
          </a>
          <nav className={`nav-links ${menuOpen ? 'open' : ''}`} aria-label="Main navigation">
            {navItems.map((item) => (
              <a href={item.href} key={item.href} onClick={closeMenu} data-testid={`link-nav-${item.label.toLowerCase().replace(' ', '-')}`}>
                {item.label}
              </a>
            ))}
            <a href="#submit" className="nav-apply" onClick={closeMenu} data-testid="link-nav-apply">
              Submit an idea <ArrowUpRight size={14} />
            </a>
          </nav>
          <button className="mobile-toggle" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} data-testid="button-mobile-menu">
            {menuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </header>

      <section className="hero" id="home">
        <div className="container hero-inner">
          <div className="hero-copy">
            <div className="eyebrow reveal">A venture portal for the determined</div>
            <h1 className="reveal reveal-delay-1">Your idea deserves more than <em>a dream.</em></h1>
            <p className="hero-lede reveal reveal-delay-2">
              Maruthi Catalyst is where raw conviction finds the structure, service, and backing to become a real venture.
            </p>
            <div className="hero-actions reveal reveal-delay-3">
              <a className="hero-apply" href="#submit" data-testid="link-hero-apply">Bring your idea forward <ArrowUpRight size={16} /></a>
              <a className="text-link" href="#process" data-testid="link-hero-process">See how it works <ArrowRight size={15} /></a>
            </div>
             <div className="hero-note"><span>✦</span> Building, rather than merely listening.</div>
          </div>
          <div className="hero-visual" aria-label="Maruthi Enterprises brand mark">
            <div className="orbital" />
            <div className="visual-card">
              <img src={logoPath} alt="Official Maruthi Enterprises mark with Strength, Vision, Service" data-testid="img-hero-logo" />
              <div className="visual-card-caption"><span>Strength | Vision | Service</span><small>Est. Maruthi</small></div>
            </div>
            <div className="orbit-tag tag-a">Founder-first</div>
            <div className="orbit-tag tag-b">Ideas → Ventures</div>
            <div className="orbit-tag tag-c">Built to last</div>
          </div>
        </div>
      </section>

      <div className="signal-strip" id="thinking">
        <div className="container signal-inner">
          <div className="signal-intro">A serious start<br />for serious ambition.</div>
          <div className="signal-item"><strong>01</strong><span>Insight before investment</span></div>
          <div className="signal-item"><strong>02</strong><span>Hands-on venture building</span></div>
          <div className="signal-item"><strong>03</strong><span>Access to the right people</span></div>
        </div>
      </div>

      <section className="section process-section" id="process">
        <div className="container">
          <div className="section-heading">
            <div><div className="section-kicker">The catalyst method</div><h2>Momentum with a point of view.</h2></div>
            <p>We do not collect pitch decks. We look for the thinking behind them, then bring the clarity, capabilities, and connections to make progress visible.</p>
          </div>
          <div className="process-grid">
            <article className="process-card">
              <div className="process-num">01 / SUBMIT</div>
              <div className="process-icon"><Compass size={22} /></div>
              <h3>Put the first version on paper.</h3>
              <p>Share the problem you see, the change you want to make, and the resources you know you need.</p>
              <ArrowRight className="process-arrow" size={19} />
            </article>
            <article className="process-card">
              <div className="process-num">02 / EVALUATE</div>
              <div className="process-icon"><ScanSearch size={22} /></div>
              <h3>Find the signal in the noise.</h3>
              <p>Our team brings a discerning lens to the market, the model, and your readiness to build.</p>
              <ArrowRight className="process-arrow" size={19} />
            </article>
            <article className="process-card">
              <div className="process-num">03 / ACCELERATE</div>
              <div className="process-icon"><Rocket size={22} /></div>
              <h3>Turn conviction into traction.</h3>
              <p>Move with practical support, strategic guidance, and an introduction to investors when the time is right.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section about-section" id="about">
        <div className="container about-layout">
          <div className="about-copy">
            <div className="section-kicker">The people behind the portal</div>
            <h2>Backing the builder, not just the business plan.</h2>
            <p>Maruthi Enterprises has always believed that strength is useful only when it is put in service of a vision. Maruthi Catalyst carries that belief into the next generation of entrepreneurs — pairing hard-won experience with the patience to build something meaningful.</p>
            <p>We bridge entrepreneurs with investors, operators, and the practical resources that make an idea investable. The ambition stays yours. The next move does not have to be.</p>
            <div className="principles">
              <div className="principle"><strong>Strength</strong><span>To stay the course</span></div>
              <div className="principle"><strong>Vision</strong><span>To see around corners</span></div>
              <div className="principle"><strong>Service</strong><span>To make progress real</span></div>
            </div>
          </div>
          <div className="leadership">
            <div className="leadership-top"><h3>In good company.</h3><span>MARUTHI / 01</span></div>
            <div className="leaders">
              <div className="leader"><div className="leader-initial">N</div><div className="leader-info"><strong>Narayana M</strong><span>Founder &amp; strategic guide</span></div></div>
              <div className="leader"><div className="leader-initial">G</div><div className="leader-info"><strong>Gopi</strong><span>Operations &amp; venture support</span></div></div>
              <div className="leader"><div className="leader-initial">M</div><div className="leader-info"><strong>Manjunath</strong><span>Growth &amp; partnership development</span></div></div>
            </div>
            <div className="leadership-quote">“The best ventures start with a founder willing to ask a better question.”</div>
          </div>
        </div>
      </section>

      <section className="section apply-section" id="submit">
        <div className="container apply-layout">
          <div className="apply-intro">
            <div className="section-kicker">Open the conversation</div>
            <h2>Make the next move.</h2>
            <p>Tell us what you are building. It does not need to be polished. It needs to be honest enough for us to see the opportunity with you.</p>
            <div className="confidential"><ShieldCheck size={16} /><span>Your submission is reviewed confidentially by the Maruthi Catalyst team.</span></div>
          </div>
          <div className="form-panel">
            {submitted ? (
              <div className="success-card" data-testid="status-form-success">
                <div className="success-mark"><Check size={31} /></div>
                <h3>We have your first draft.</h3>
                <p>Thank you for trusting us with the idea. Our team will review your submission confidentially and reach out when there is a thoughtful next step.</p>
                <button className="reset-button" onClick={resetForm} data-testid="button-submit-another">Submit another idea</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate data-testid="form-idea-application">
                {submitError && (
                  <div className="form-error-banner" role="alert" data-testid="status-form-error">
                    {submitError}
                  </div>
                )}
                <input
                  type="text"
                  name="website"
                  value={honeypot}
                  onChange={(event) => setHoneypot(event.target.value)}
                  className="hp-field"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                />
                <div className="form-grid">
                  <Field label="Full Name" field="fullName" value={form.fullName} error={errors.fullName} onChange={updateField} />
                  <Field label="Email Address" field="email" type="email" value={form.email} error={errors.email} onChange={updateField} />
                  <Field label="Contact Number" field="contact" type="tel" value={form.contact} error={errors.contact} onChange={updateField} />
                  <div className="field">
                    <label htmlFor="industry">Startup Industry <span>*</span></label>
                    <select id="industry" value={form.industry} onChange={(event) => updateField('industry', event.target.value)} className={errors.industry ? 'invalid' : ''} data-testid="select-startup-industry">
                      <option value="">Choose an industry</option>
                      <option value="Consumer">Consumer</option>
                      <option value="Technology">Technology</option>
                      <option value="Health & wellness">Health &amp; wellness</option>
                      <option value="Finance">Finance</option>
                      <option value="Education">Education</option>
                      <option value="Climate & infrastructure">Climate &amp; infrastructure</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.industry && <div className="field-error" data-testid="error-industry">{errors.industry}</div>}
                  </div>
                  <Field label="Idea Title" field="title" value={form.title} error={errors.title} onChange={updateField} full />
                  <Field label="Detailed Idea Description" field="description" value={form.description} error={errors.description} onChange={updateField} full textarea placeholder="What problem are you solving, and why now?" />
                  <Field label="What resources do you need?" field="resources" value={form.resources} error={errors.resources} onChange={updateField} full textarea placeholder="Capital, expertise, introductions, technology, or something else?" />
                </div>
                <div className="form-footer">
                  <div className="form-footer-note">Required fields are marked with an asterisk.<br />No polished pitch deck required.</div>
                  <button type="submit" className="submit-button" disabled={isSubmitting} data-testid="button-submit-idea">
                    {isSubmitting ? 'Sending…' : <>Send my idea <ArrowUpRight size={16} /></>}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <div className="footer-top">
            <a href="#home" className="footer-brand" data-testid="link-footer-home"><img src={logoPath} alt="Maruthi Enterprises logo" /><span><strong>Maruthi Catalyst</strong><span>Transforming Vision into Venture.</span></span></a>
             <div className="footer-cta"><p>Have an idea that will not leave you alone?</p><a href="#submit" data-testid="link-footer-apply">Start with the first version <ArrowUpRight size={14} /></a><a className="footer-email" href={`mailto:${contactEmail}`} data-testid="link-footer-email">{contactEmail}</a></div>
          </div>
          <div className="footer-bottom"><span>© {new Date().getFullYear()} Maruthi Enterprises. Built for the ambitious.</span><span>Strength · Vision · Service</span></div>
        </div>
      </footer>
    </main>
  );
}

function Field({ label, field, value, error, onChange, type = 'text', full = false, textarea = false, placeholder }: {
  label: string;
  field: keyof FormValues;
  value: string;
  error?: string;
  onChange: (field: keyof FormValues, value: string) => void;
  type?: string;
  full?: boolean;
  textarea?: boolean;
  placeholder?: string;
}) {
  return (
    <div className={`field ${full ? 'full' : ''}`}>
      <label htmlFor={field}>{label} <span>*</span></label>
      {textarea ? (
        <textarea id={field} value={value} placeholder={placeholder} onChange={(event) => onChange(field, event.target.value)} className={error ? 'invalid' : ''} data-testid={`textarea-${field}`} />
      ) : (
        <input id={field} type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(field, event.target.value)} className={error ? 'invalid' : ''} data-testid={`input-${field}`} />
      )}
      {error && <div className="field-error" data-testid={`error-${field}`}>{error}</div>}
    </div>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin" component={AdminDashboard} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;