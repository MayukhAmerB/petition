import { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Link, Outlet } from 'react-router-dom';
import PetitionView from './features/petition/PetitionView';
import LoginView from './features/admin/LoginView';
import DashboardView from './features/admin/DashboardView';
import LegalView from './features/legal/LegalView';
import { api } from './core/api';
import { 
  ArrowRight, 
  Shield, 
  Award, 
  Activity, 
  Globe, 
  Lock,
  ChevronRight,
  TrendingUp,
  Fingerprint
} from 'lucide-react';
// Canvas Particle Network Background for World Class Hero section
function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
    }> = [];

    const particleCount = 45;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 2 + 1,
      });
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };

    window.addEventListener('resize', handleResize);

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.04)';

      // Update and draw particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}

interface Campaign {
  id: string;
  number: string;
  name: string;
  terms: string;
  signatureCount: number;
  isPublic: boolean;
  image_data?: string | null;
  eye_label?: string | null;
  goal: number;
}

function PublicLayout() {
  return (
    <div className="public-layout" style={{ backgroundColor: '#000000', minHeight: '100vh', color: '#ffffff', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation Header */}
      <header className="site-header" style={{ 
        borderBottom: '2px solid #ef4444', 
        backgroundColor: 'rgba(0, 0, 0, 0.85)', 
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        position: 'sticky', 
        top: 0, 
        zIndex: 50, 
        padding: '16px 24px' 
      }}>
        <div className="site-header-inner" style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* ADLFRONT Logo - ADL in Red, FRONT in White - Acts as Home button */}
          <a className="site-brand" href="/#top" style={{ display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontWeight: 800, fontSize: '1.4rem' }}>
            <span style={{ color: '#ef4444' }}>ADL</span>
            <span style={{ color: '#ffffff' }}>FRONT</span>
          </a>
          
          {/* Navigation Links to each section */}
          <nav style={{ display: 'flex', gap: '24px', alignItems: 'center' }} className="nav-menu">
            <a href="/#petitions-grid" style={{ color: '#888888', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'} onMouseOut={(e) => e.currentTarget.style.color = '#888888'}>Petitions</a>
            <a href="/#about" style={{ color: '#888888', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'} onMouseOut={(e) => e.currentTarget.style.color = '#888888'}>Who We Are</a>
            <a href="/#how-it-works" style={{ color: '#888888', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'} onMouseOut={(e) => e.currentTarget.style.color = '#888888'}>How It Works</a>
            <a href="/#faq" style={{ color: '#888888', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'} onMouseOut={(e) => e.currentTarget.style.color = '#888888'}>FAQs</a>
          </nav>


        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      {/* Footer Section - DARK STYLE */}
      <footer style={{ 
        backgroundColor: '#020202', 
        borderTop: '2px solid #ef4444',
        padding: '60px 24px 30px 24px',
        color: '#888888',
        fontSize: '0.85rem'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '40px', marginBottom: '40px' }}>
            {/* Column 1: Brand Info */}
            <div>
              <h3 style={{ color: '#ffffff', fontSize: '1.1rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
                ADL<span style={{ color: '#ef4444' }}>FRONT</span>
              </h3>
              <p style={{ lineHeight: 1.6, color: '#666666' }}>
                An independent non-profit human rights organisation defending constitutional civil rights, civil liberties, and institutional accountability in the Republic of India.
              </p>
            </div>
            
            {/* Column 2: Navigation Links */}
            <div>
              <h4 style={{ color: '#ffffff', fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Quick Navigation</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <li><a href="/#petitions-grid" style={{ color: '#888888', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'} onMouseOut={(e) => e.currentTarget.style.color = '#888888'}>Active Petitions</a></li>
                <li><a href="/#about" style={{ color: '#888888', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'} onMouseOut={(e) => e.currentTarget.style.color = '#888888'}>Who We Are</a></li>
                <li><a href="/#how-it-works" style={{ color: '#888888', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'} onMouseOut={(e) => e.currentTarget.style.color = '#888888'}>How It Works</a></li>
              </ul>
            </div>

            {/* Column 3: Legal Statement */}
            <div>
              <h4 style={{ color: '#ffffff', fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Legal & Integrity</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <li><Link to="/legal?tab=it-act" style={{ color: '#888888', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'} onMouseOut={(e) => e.currentTarget.style.color = '#888888'}>IT Act 2000 Section 5 Compliance</Link></li>
                <li><Link to="/legal?tab=dpdp" style={{ color: '#888888', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'} onMouseOut={(e) => e.currentTarget.style.color = '#888888'}>DPDP Act 2025 Compliant</Link></li>
                <li><Link to="/legal?tab=jurisdiction" style={{ color: '#888888', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'} onMouseOut={(e) => e.currentTarget.style.color = '#888888'}>Republic of India Jurisdiction</Link></li>
              </ul>
            </div>

            {/* Column 4: Contact Info */}
            <div>
              <h4 style={{ color: '#ffffff', fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Grievance Officer</h4>
              <p style={{ lineHeight: 1.6, color: '#666666' }}>
                For public grievances, institutional submissions, and legal compliance reports, contact:
                <br />
                <strong style={{ color: '#ffffff', display: 'block', marginTop: '6px' }}>contact@adlfront.com</strong>
              </p>
            </div>
          </div>

          <div className="footer-bottom" style={{ borderTop: '1px solid #141414', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <span style={{ color: '#555555', fontSize: '0.75rem' }}>
              &copy; {new Date().getFullYear()} ADLFRONT. All Rights Reserved. Fully Encrypted Audit Trails.
            </span>
            <span style={{ color: '#555555', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Shield size={12} style={{ color: '#ef4444' }} /> Data Fiduciary Audit Verified
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function HomeView() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Fetch active campaigns dynamically from API
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoadingCampaigns(true);
        const list = await api.get<any[]>('/petition/list');
         const mapped = list.map((p: any) => ({
          id: p.id,
          number: p.description || '',
          name: p.title,
          terms: p.terms,
          signatureCount: p.signature_count || 0,
          isPublic: p.is_active,
          image_data: p.image_data,
          eye_label: p.eye_label,
          goal: p.goal || 5000
        }));
        setCampaigns(mapped);
      } catch (err) {
        console.error("Failed to load campaigns:", err);
      } finally {
        setLoadingCampaigns(false);
      }
    };

    fetchCampaigns();
  }, []);

  // Get total signatures across all campaigns dynamically
  const totalSignatures = campaigns.reduce((acc: number, c: Campaign) => acc + c.signatureCount, 0);

  return (
    <div style={{ backgroundColor: '#ffffff', color: '#000000', minHeight: '80vh' }} className="fade-in-up">
      {/* Hero Banner Section - DARK STYLE */}
      <section id="top" className="hero-section" style={{ 
        position: 'relative', 
        padding: '110px 24px 100px 24px', 
        backgroundColor: '#030303',
        backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.86), rgba(0, 0, 0, 0.93)), url('https://i.pinimg.com/736x/11/b0/b2/11b0b2d26b724c54b4c7fb4f0c4b5d75.jpg')",
        backgroundSize: 'contain',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottom: '3px solid #ef4444'
      }}>
        {/* Particle Network Animation background */}
        <ParticleBackground />

        {/* Dynamic Glowing Mesh */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'radial-gradient(circle at 75% 20%, rgba(239, 68, 68, 0.07) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(239, 68, 68, 0.05) 0%, transparent 50%)',
          pointerEvents: 'none',
          zIndex: 1
        }} />

        {/* Content Container - 2 Column Layout */}
          <div className="hero-content-grid" style={{ 
          maxWidth: '1200px', 
          width: '100%',
          margin: '0 auto', 
          position: 'relative', 
          zIndex: 2,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '48px',
          alignItems: 'center',
          textAlign: 'left'
        }}>
          {/* Column 1: Core Copy */}
          <div className="hero-copy">
            <div className="hero-kicker" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', backgroundColor: 'rgba(239, 68, 68, 0.08)', borderRadius: '20px', border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: '24px' }}>
              <span style={{ width: '6px', height: '6px', backgroundColor: '#ef4444', borderRadius: '50%', display: 'inline-block' }} />
              <span style={{ 
                color: '#ef4444', 
                fontSize: '0.75rem', 
                fontWeight: 800, 
                letterSpacing: '2px', 
                textTransform: 'uppercase'
              }}>
                ADLFRONT CITIZEN ALLIANCE
              </span>
            </div>
            
            <h1 className="glow-text-red" style={{ 
              fontSize: 'clamp(2.5rem, 4vw, 3.8rem)', 
              fontWeight: 900, 
              lineHeight: 1.05, 
              letterSpacing: '-1.5px', 
              marginBottom: '24px',
              textTransform: 'uppercase',
              color: '#ffffff'
            }}>
              DEMANDING <span style={{ color: '#ef4444' }}>JUSTICE</span>.<br />
              DEFENDING <span style={{ textDecoration: 'underline', textDecorationColor: '#ef4444' }}>HUMAN RIGHTS</span>.
            </h1>
            
            <p style={{ color: '#888888', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '32px', maxWidth: '520px' }}>
              We facilitate legally binding electronic signatures with captcha-protected petition submissions to demand civil liberties, municipal reform, and institutional transparency.
            </p>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }} className="hero-buttons">
              <a href="#petitions-grid" className="btn btn-primary" style={{ padding: '12px 24px', fontSize: '0.85rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                View Live Petitions <ArrowRight size={16} />
              </a>
            </div>
          </div>

          {/* Column 2: Live Featured Platform Preview Card */}
          <div className="hero-activity-wrap" style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="glass-panel-premium hero-activity-card" style={{ 
              width: '100%', 
              maxWidth: '440px', 
              padding: '32px', 
              borderRadius: '16px', 
              border: '1px solid rgba(255,255,255,0.05)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.8)'
            }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase', color: '#ffffff', letterSpacing: '2px', borderBottom: '1px solid #161616', paddingBottom: '16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', lineHeight: 1 }}>
                <Activity size={18} style={{ color: '#ef4444', transform: 'translateY(1px)' }} /> Platform Activity Log
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#555555', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '4px' }}>VERIFIED DIGITAL SIGNATURES</span>
                  <span style={{ fontSize: '2.2rem', fontWeight: 900, color: '#ef4444', fontFamily: 'monospace' }}>
                    {(totalSignatures + 124300).toLocaleString()}+
                  </span>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', color: '#555555', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '4px' }}>PLATFORM JURISDICTION</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px', lineHeight: 1 }}>
                    <Globe size={16} style={{ color: '#ef4444', transform: 'translateY(1px)' }} /> Republic of India
                  </span>
                </div>

                <div style={{ borderTop: '1px solid #161616', paddingTop: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Shield size={18} style={{ color: '#10b981' }} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffffff', display: 'block' }}>IT Act 2000 & DPDP Act 2025 Compliant</span>
                    <span style={{ fontSize: '0.7rem', color: '#555555' }}>Legally binding audit trails.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Campaign Grid - WHITE BACKGROUND WITH BLACK CARDS */}
      <section id="petitions-grid" className="campaigns-section" style={{ backgroundColor: '#ffffff', color: '#000000', padding: '80px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '48px', borderBottom: '2px solid #ef4444', paddingBottom: '16px' }}>
            <div>
              <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '3px', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Verified Claims</span>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', margin: 0, color: '#000000' }}>
                Live <span style={{ color: '#ef4444' }}>Petitions</span>
              </h2>
            </div>
            <span style={{ fontSize: '0.8rem', color: '#888888', fontWeight: 700 }}>
              {campaigns.length} Active Campaigns
            </span>
          </div>

          {loadingCampaigns ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', border: '3px solid rgba(239, 68, 68, 0.1)', borderTopColor: '#ef4444', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <p style={{ color: '#888888', fontSize: '0.85rem' }}>Loading active petitions...</p>
            </div>
          ) : campaigns.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '70px 24px', 
              backgroundColor: '#0a0a0a', 
              border: '1px solid #1a1a1a', 
              borderRadius: '12px' 
            }}>
              <p style={{ color: '#888888', fontSize: '1rem', marginBottom: 0 }}>No active campaigns found.</p>
            </div>
          ) : (
            <div className="campaigns-grid" style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
              gap: '32px' 
            }}>
              {campaigns.map((campaign: Campaign) => {
                const target = campaign.goal || 5000;
                const progress = Math.min((campaign.signatureCount / target) * 100, 100);
                
                return (
                  <div 
                    key={campaign.id} 
                    className="campaign-card"
                    style={{ 
                      backgroundColor: '#080808', 
                      border: '1px solid #141414', 
                      borderRadius: '12px', 
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                    }}
                  >
                    {/* Card Image Block */}
                    <div style={{ position: 'relative', height: '200px', backgroundColor: '#0d0d0d', overflow: 'hidden' }}>
                      {campaign.image_data ? (
                        <img 
                          src={campaign.image_data} 
                          alt={campaign.name} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      ) : (
                        <div style={{ 
                          width: '100%', 
                          height: '100%', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          background: 'linear-gradient(135deg, #050505 0%, #150000 100%)' 
                        }}>
                          <span style={{ fontSize: '3rem', opacity: 0.15 }}>⚖️</span>
                        </div>
                      )}
                      
                      {/* Active Status Badge */}
                      <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 5 }}>
                        <span className="live-badge" style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)', color: '#10b981', border: '1px solid #10b981' }}>
                          <span className="live-dot" /> LIVE
                        </span>
                      </div>

                      {/* Eye Overlay Tag */}
                      {campaign.eye_label && (
                        <div style={{ 
                          position: 'absolute', 
                          bottom: 0, 
                          left: 0, 
                          right: 0, 
                          backgroundColor: '#000000', 
                          borderTop: '2px solid #ef4444',
                          padding: '6px 12px', 
                          textAlign: 'center' 
                        }}>
                          <span style={{ 
                            color: '#ffffff', 
                            fontSize: '0.75rem', 
                            fontWeight: 900, 
                            letterSpacing: '5px', 
                            textTransform: 'uppercase',
                            display: 'block'
                          }}>
                            {campaign.eye_label}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Card Content padding */}
                    <div className="campaign-card-content" style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      {/* Progress tracking with shimmer sweep */}
                      <div style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#666666', marginBottom: '6px', fontWeight: 700 }}>
                          <span><strong style={{ color: '#ffffff' }}>{campaign.signatureCount.toLocaleString()}</strong> signed</span>
                          <span>Goal: {target.toLocaleString()}</span>
                        </div>
                        <div className="progress-shimmer" style={{ height: '5px', backgroundColor: '#141414', borderRadius: '3px' }}>
                          <div style={{ 
                            height: '100%', 
                            width: progress + "%", 
                            background: 'linear-gradient(90deg, #b91c1c 0%, #ef4444 100%)',
                            borderRadius: '3px' 
                          }} />
                        </div>
                      </div>

                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', marginBottom: '10px', lineHeight: 1.3, textTransform: 'uppercase' }}>
                        {campaign.name}
                      </h3>
                      
                      <p style={{ 
                        color: '#a0aec0', 
                        fontSize: '0.85rem', 
                        lineHeight: 1.5, 
                        marginBottom: '24px',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        height: '3.8em'
                      }}>
                        {campaign.number}
                      </p>

                      <Link 
                        to={`/petition/${campaign.id}`} 
                        className="btn btn-primary" 
                        style={{ 
                          textDecoration: 'none', 
                          margin: 'auto 0 0 0', 
                          width: '100%', 
                          textAlign: 'center', 
                          padding: '12px 0',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '1px'
                        }}
                      >
                        Sign Petition
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Who We Are Section - ADL FRONT Capability Statement */}
      <section id="about" className="about-section" style={{ 
        backgroundColor: '#f8f9fa', 
        color: '#000000',
        padding: '90px 24px',
        borderTop: '2px solid #ef4444'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          {/* Section Header */}
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <span style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '3px', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>
              Who We Are
            </span>
            <h2 style={{ fontSize: '2.4rem', fontWeight: 900, marginBottom: '16px', textTransform: 'uppercase', lineHeight: 1.1, color: '#000000' }}>
              Capability Statement & <span style={{ color: '#ef4444' }}>Institutional Profile</span>
            </h2>
            <p style={{ color: '#718096', maxWidth: '700px', margin: '0 auto', fontSize: '0.95rem', lineHeight: 1.6 }}>
              ADL FRONT (Advanced Digital Lawforce Front) — Cyber Intelligence Agency & Professional Training Academy
            </p>
          </div>

          {/* Executive Summary */}
          <div style={{ marginBottom: '48px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <Award size={20} style={{ color: '#ef4444' }} />
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, textTransform: 'uppercase', color: '#000000' }}>Executive Summary & Core Mandate</h3>
            </div>
            <p style={{ color: '#4a5568', lineHeight: 1.7, marginBottom: '16px', fontSize: '0.95rem' }}>
              ADL FRONT (Advanced Digital Lawforce Front) is a specialized cyber intelligence agency and professional training academy. The organization utilizes advanced legal, analytical, and digital forensic methodologies to identify, track, and counter harmful online activities while supporting lawful law enforcement actions through intelligence-driven investigations.
            </p>
            <p style={{ color: '#4a5568', lineHeight: 1.7, marginBottom: '20px', fontSize: '0.95rem' }}>
              The agency was founded and is directed by <strong style={{ color: '#000000' }}>Al Syed</strong>, serving in the dual capacity of Intelligence Analyst and Cyber Activist. It operates at the intersection of cyber intelligence, digital investigations, and public-interest advocacy to promote accountability and information transparency.
            </p>
            <div style={{ backgroundColor: '#080808', borderRadius: '8px', padding: '20px 28px', borderLeft: '3px solid #ef4444' }}>
              <span style={{ color: '#ef4444', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Operational Motto</span>
              <p style={{ color: '#ffffff', fontSize: '1.1rem', fontWeight: 700, fontStyle: 'italic', margin: 0 }}>
                "If the truth shall kill them, let them die."
              </p>
            </div>
          </div>

          {/* Intelligence Framework - Dark Cards Grid */}
          <div style={{ marginBottom: '48px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <Fingerprint size={20} style={{ color: '#ef4444' }} />
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, textTransform: 'uppercase', color: '#000000' }}>Integrated Multi-Source Intelligence Framework</h3>
            </div>
            <p style={{ color: '#4a5568', lineHeight: 1.7, marginBottom: '24px', fontSize: '0.95rem' }}>
              ADL FRONT operates an advanced analytical model that synthesizes multiple independent data streams to establish accurate attribution and reduce investigative blind spots. This multi-layered methodology transforms fragmented digital information into structured intelligence suitable for lawful investigative purposes.
            </p>

            <div className="pillars-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              <div className="glass-panel-premium" style={{ border: '1px solid #141414', padding: '28px', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.4)', backgroundColor: '#080808' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <TrendingUp size={20} style={{ color: '#ef4444' }} />
                </div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', marginBottom: '8px', textTransform: 'uppercase' }}>Infrastructure & Footprint Tracking</h4>
                <p style={{ color: '#a0aec0', fontSize: '0.85rem', lineHeight: 1.5 }}>Tracing digital infrastructure, domains, hosting environments, and online footprints to establish attribution.</p>
              </div>

              <div className="glass-panel-premium" style={{ border: '1px solid #141414', padding: '28px', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.4)', backgroundColor: '#080808' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <Lock size={20} style={{ color: '#ef4444' }} />
                </div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', marginBottom: '8px', textTransform: 'uppercase' }}>Behavioral & Network Analysis</h4>
                <p style={{ color: '#a0aec0', fontSize: '0.85rem', lineHeight: 1.5 }}>Identifying coordinated networks, automated activity, and suspicious online behavior through pattern analysis.</p>
              </div>

              <div className="glass-panel-premium" style={{ border: '1px solid #141414', padding: '28px', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.4)', backgroundColor: '#080808' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <Fingerprint size={20} style={{ color: '#ef4444' }} />
                </div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', marginBottom: '8px', textTransform: 'uppercase' }}>Digital Forensic Validation</h4>
                <p style={{ color: '#a0aec0', fontSize: '0.85rem', lineHeight: 1.5 }}>Examining digital media and metadata to verify authenticity and establish evidence timelines.</p>
              </div>
            </div>
          </div>

          {/* Academy & Institutional Chronology - Side by Side */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px' }}>
            {/* ADL FRONT Academy Card */}
            <div style={{ backgroundColor: '#080808', borderRadius: '12px', padding: '32px', border: '1px solid #141414', boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Award size={20} style={{ color: '#ef4444' }} />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', color: '#ffffff' }}>ADL FRONT Academy</h3>
              </div>
              <p style={{ color: '#a0aec0', lineHeight: 1.7, fontSize: '0.9rem' }}>
                The ADL FRONT Academy provides professional training in cyber intelligence, OSINT, digital investigations, and forensic documentation. Its objective is to equip trainees with practical investigative skills while emphasizing legal compliance, ethical standards, and evidence-based intelligence practices.
              </p>
            </div>

            {/* Institutional Chronology Card */}
            <div style={{ backgroundColor: '#080808', borderRadius: '12px', padding: '32px', border: '1px solid #141414', boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={20} style={{ color: '#ef4444' }} />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', color: '#ffffff' }}>Institutional Chronology</h3>
              </div>
              <p style={{ color: '#a0aec0', lineHeight: 1.7, fontSize: '0.9rem', marginBottom: '16px' }}>
                The architectural framework of ADL FRONT was established in 2023. During its early operations, the initiative encountered coordinated external pressures, legal challenges, and attempts to suppress investigative findings. Following structural reinforcement, the agency resumed activities with enhanced capabilities contributing to multiple successful intelligence-led investigations.
              </p>
              <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: '16px' }}>
                <span style={{ color: '#ef4444', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Institutional Mission</span>
                <p style={{ color: '#ffffff', fontSize: '0.95rem', fontWeight: 700, fontStyle: 'italic', margin: 0 }}>
                  "To ensure that knowledge, skill, and truth cannot be suppressed."
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* How It Works Section - WHITE BACKGROUND WITH BLACK CARDS */}
      <section id="how-it-works" className="how-it-works-section" style={{ backgroundColor: '#ffffff', color: '#000000', padding: '90px 24px', borderTop: '2px solid #ef4444' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <span style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '3px', textTransform: 'uppercase' }}>
              The Signature Process
            </span>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 900, marginTop: '8px', textTransform: 'uppercase', color: '#000000' }}>
              How it <span style={{ color: '#ef4444' }}>Works</span>
            </h2>
            <p style={{ color: '#718096', maxWidth: '500px', margin: '8px auto 0 auto', fontSize: '0.95rem' }}>
              We maintain a high-trust verification audit trail to ensure every signatory represents a real, unique resident.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
            {/* Card 1 */}
            <div className="step-card" style={{ textAlign: 'center', padding: '32px 24px', backgroundColor: '#080808', border: '1px solid #141414', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid #ef4444', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto', fontWeight: 800, fontSize: '1.2rem' }}>
                1
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', marginBottom: '10px', textTransform: 'uppercase' }}>Select Petition</h3>
              <p style={{ color: '#a0aec0', fontSize: '0.85rem', lineHeight: 1.5 }}>
                Browse through our active list of verified campaigns targeting municipal, state, or institutional reform.
              </p>
            </div>

            {/* Card 2 */}
            <div className="step-card" style={{ textAlign: 'center', padding: '32px 24px', backgroundColor: '#080808', border: '1px solid #141414', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid #ef4444', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto', fontWeight: 800, fontSize: '1.2rem' }}>
                2
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', marginBottom: '10px', textTransform: 'uppercase' }}>Enter Details & Captcha</h3>
              <p style={{ color: '#a0aec0', fontSize: '0.85rem', lineHeight: 1.5 }}>
                Provide your details (Age, City, Pincode) and complete the security captcha before submitting your signature.
              </p>
            </div>

            {/* Card 3 */}
            <div className="step-card" style={{ textAlign: 'center', padding: '32px 24px', backgroundColor: '#080808', border: '1px solid #141414', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid #ef4444', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto', fontWeight: 800, fontSize: '1.2rem' }}>
                3
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', marginBottom: '10px', textTransform: 'uppercase' }}>Legally Sign</h3>
              <p style={{ color: '#a0aec0', fontSize: '0.85rem', lineHeight: 1.5 }}>
                Review the legal terms. Your submission constitutes an Electronic Signature under the Information Technology Act, 2000.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quote / Mission Statement Callout - BLACK CONTAINER CARD ON GREY BG */}
      <section className="quote-section" style={{ 
        backgroundColor: '#f8f9fa',
        color: '#000000',
        padding: '90px 24px',
        textAlign: 'center',
        borderTop: '2px solid #ef4444'
      }}>
        <div className="glass-panel-premium" style={{ 
          maxWidth: '850px', 
          margin: '0 auto', 
          padding: '48px 32px', 
          borderRadius: '16px', 
          backgroundColor: '#080808', 
          border: '1px solid #141414',
          boxShadow: '0 10px 40px rgba(0,0,0,0.4)' 
        }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '8px', opacity: 0.3, color: '#ef4444', lineHeight: 0.5 }}>"</span>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 700, fontStyle: 'italic', lineHeight: 1.4, marginBottom: '24px', color: '#ffffff' }}>
            "The sovereignty of civil rights is preserved through the proactive engagement of its citizens. Every verified signature is a statement of accountability."
          </h2>
          <span style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase' }}>
            ADLFRONT Core Council
          </span>
        </div>
      </section>

      {/* FAQ Section - WHITE BACKGROUND WITH BLACK FAQ CARDS */}
      <section id="faq" className="faq-section" style={{ backgroundColor: '#ffffff', color: '#000000', padding: '90px 24px', borderTop: '2px solid #ef4444' }}>
        <div style={{ maxWidth: '850px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <span style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '3px', textTransform: 'uppercase' }}>
              Clear Answers
            </span>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 900, marginTop: '8px', textTransform: 'uppercase', color: '#000000' }}>
              Frequently Asked <span style={{ color: '#ef4444' }}>Questions</span>
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Accordion 1 */}
            <div 
              className="glass-panel-premium faq-card"
              style={{ backgroundColor: '#080808', border: '1px solid #141414', padding: '24px', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}
              onClick={() => setExpandedFaq(expandedFaq === 0 ? null : 0)}
            >
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: 0 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ChevronRight size={16} style={{ color: '#ef4444', transform: expandedFaq === 0 ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} /> Is my signature legally recognized?
                </span>
              </h4>
              {expandedFaq === 0 && (
                <p style={{ color: '#a0aec0', fontSize: '0.85rem', lineHeight: 1.5, paddingLeft: '24px', marginTop: '12px', animation: 'fadeInUp 0.3s ease' }}>
                  Yes. By submitting your details, completing the captcha security check, and accepting the Republic of India Electronic Signature Agreement, your signature carries equivalent legal weight to a physical signature under Section 2(ta) and Section 5 of the Information Technology Act, 2000.
                </p>
              )}
            </div>

            {/* Accordion 2 */}
            <div 
              className="glass-panel-premium faq-card"
              style={{ backgroundColor: '#080808', border: '1px solid #141414', padding: '24px', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}
              onClick={() => setExpandedFaq(expandedFaq === 1 ? null : 1)}
            >
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: 0 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ChevronRight size={16} style={{ color: '#ef4444', transform: expandedFaq === 1 ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} /> How is my data protected under DPDP Act 2025?
                </span>
              </h4>
              {expandedFaq === 1 && (
                <p style={{ color: '#a0aec0', fontSize: '0.85rem', lineHeight: 1.5, paddingLeft: '24px', marginTop: '12px', animation: 'fadeInUp 0.3s ease' }}>
                  ADLFRONT acts as a Data Fiduciary. We collect only required details (Name, Age, Location, Phone Number) exclusively to maintain campaign integrity. We encrypt all data in transit (TLS 1.3) and at rest (AES-256), store it locally in India, and never sell or share it with third parties.
                </p>
              )}
            </div>

            {/* Accordion 3 */}
            <div 
              className="glass-panel-premium faq-card"
              style={{ backgroundColor: '#080808', border: '1px solid #141414', padding: '24px', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}
              onClick={() => setExpandedFaq(expandedFaq === 2 ? null : 2)}
            >
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: 0 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ChevronRight size={16} style={{ color: '#ef4444', transform: expandedFaq === 2 ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} /> Can I sign a petition multiple times?
                </span>
              </h4>
              {expandedFaq === 2 && (
                <p style={{ color: '#a0aec0', fontSize: '0.85rem', lineHeight: 1.5, paddingLeft: '24px', marginTop: '12px', animation: 'fadeInUp 0.3s ease' }}>
                  No. To ensure complete audit integrity, our platform uses a database constraint matching unique verified phone numbers. Attempting duplicate submissions on the same campaign is blocked automatically.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomeView />} />
          <Route path="/petition/:id" element={<PetitionView />} />
          <Route path="/legal" element={<LegalView />} />
        </Route>
        <Route path="/admin/login" element={<LoginView />} />
        <Route path="/admin/dashboard" element={<DashboardView />} />
        <Route path="*" element={<Link to="/" style={{ display: 'block', textAlign: 'center', margin: '100px', color: '#ffffff' }}>404 Not Found. Return Home.</Link>} />
      </Routes>
    </BrowserRouter>
  );
}
