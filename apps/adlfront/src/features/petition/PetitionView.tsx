import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../core/api';
import { 
  Users, 
  Smartphone, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Calendar
} from 'lucide-react';

interface Petition {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  image_data?: string | null;
  eye_label?: string | null;
  terms: string;
  signature_count: number;
  is_active: boolean;
  created_at: string;
  goal: number;
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'altcha-widget': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        challengeurl?: string;
        auto?: string;
        ref?: React.RefObject<any>;
      }, HTMLElement>;
    }
  }
}

const INDIA_STATES_AND_UNION_TERRITORIES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
];

export default function PetitionView() {
  const { id } = useParams<{ id: string }>();
  const [petition, setPetition] = useState<Petition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [stateName, setStateName] = useState('');
  const country = 'India';
  const [phone, setPhone] = useState('');
  
  // Verification flow states
  const [step, setStep] = useState<'details' | 'success'>('details');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Captcha states
  const [captcha, setCaptcha] = useState<{ id: string; question: string } | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState('');

  // Altcha states
  const [altchaVerified, setAltchaVerified] = useState(false);
  const [altchaPayload, setAltchaPayload] = useState('');
  const altchaRef = React.useRef<any>(null);

  const readAltchaVerification = React.useCallback((ev?: any) => {
    const elem = altchaRef.current;
    if (!elem) {
      return { verified: false, payload: '' };
    }

    const detail = ev?.detail || {};
    const hiddenInput =
      elem.querySelector?.('input[name="altcha"]') ||
      elem.shadowRoot?.querySelector?.('input[name="altcha"]');
    const widgetPayload =
      detail.payload ||
      detail.response ||
      detail.value ||
      elem.payload ||
      elem.value ||
      hiddenInput?.value ||
      '';
    const widgetState = detail.state || elem.state || elem.getAttribute?.('data-state');
    const visibleVerified =
      elem.textContent?.toLowerCase().includes('verified') ||
      elem.shadowRoot?.textContent?.toLowerCase().includes('verified') ||
      false;
    const verified =
      widgetState === 'verified' ||
      ev?.type === 'verified' ||
      Boolean(widgetPayload) ||
      Boolean(visibleVerified);

    setAltchaVerified(verified);
    if (widgetPayload) {
      setAltchaPayload(widgetPayload);
    } else if (!verified) {
      setAltchaPayload('');
    }

    return { verified, payload: widgetPayload };
  }, []);

  const loadCaptcha = async () => {
    try {
      const data = await api.get<{ id: string; question: string }>('/captcha/generate');
      setCaptcha(data);
      setCaptchaAnswer('');
    } catch (err) {
      console.error('Failed to load captcha', err);
    }
  };

  // Fetch petition details
  const fetchPetition = async (showLoader = true) => {
    if (!id) return;
    if (showLoader) setLoading(true);
    try {
      const data = await api.get<Petition>(`/petition/${id}`);
      setPetition(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError((err as any).message || 'Failed to load petition.');
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    fetchPetition(true);
    loadCaptcha();
    
    // Poll signature count every 10 seconds for real-time update
    const interval = setInterval(() => {
      fetchPetition(false);
    }, 10000);
    
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    const elem = altchaRef.current;
    if (!elem) {
      return;
    }

    const handleAltchaEvent = (ev: Event) => readAltchaVerification(ev);
    elem.addEventListener('statechange', handleAltchaEvent);
    elem.addEventListener('verified', handleAltchaEvent);
    elem.addEventListener('change', handleAltchaEvent);

    const timer = window.setInterval(() => readAltchaVerification(), 500);

    return () => {
      window.clearInterval(timer);
      elem.removeEventListener('statechange', handleAltchaEvent);
      elem.removeEventListener('verified', handleAltchaEvent);
      elem.removeEventListener('change', handleAltchaEvent);
    };
  }, [step, captcha?.id, readAltchaVerification]);

  // Submit Signature directly
  const handleSubmitSignature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !age.trim() || !city.trim() || !pincode.trim() || !stateName.trim() || !country.trim() || !phone.trim() || !captchaAnswer.trim()) {
      setActionError('All fields are required.');
      return;
    }
    if (phone.length !== 10) {
      setActionError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (!agreedTerms) {
      setActionError('You must agree to the Terms and Conditions.');
      return;
    }
    const altcha = readAltchaVerification();
    if (!altcha.verified) {
      setActionError('Please complete the cryptographic verify check.');
      return;
    }
    if (!altcha.payload && !altchaPayload) {
      setActionError('Verification is complete, but the security payload was not captured. Please refresh the verification check and try again.');
      return;
    }
    
    setSubmitting(true);
    setActionError(null);
    
    try {
      const volunteerDetails = {
        age,
        city,
        pincode,
        state: stateName,
        country
      };

      await api.post('/petition/sign', {
        phone: `+91${phone}`,
        petition_id: id,
        first_name: `${firstName} ${lastName}`,
        last_name: JSON.stringify(volunteerDetails),
        agreed_terms: agreedTerms,
        captcha_id: captcha?.id || '',
        captcha_answer: captchaAnswer,
        altcha_payload: altcha.payload || altchaPayload,
      });

      setStep('success');
      fetchPetition(false);
    } catch (err) {
      setActionError((err as any).message || 'Failed to submit signature.');
      loadCaptcha();
      // Reload altcha challenge by resetting its element key
      if (altchaRef.current) {
        altchaRef.current.reload();
      }
      setAltchaVerified(false);
      setAltchaPayload('');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
        <Loader2 size={40} className="animate-spin" style={{ color: 'var(--primary)' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Loading petition details...</p>
      </div>
    );
  }

  if (error || !petition) {
    return (
      <div style={{ maxWidth: '500px', margin: '40px auto', padding: '24px', textAlign: 'center' }} className="glass-panel animate-fade-in">
        <AlertCircle size={48} style={{ color: 'var(--danger)', marginBottom: '16px' }} />
        <h2 style={{ marginBottom: '8px' }}>Error Loading Petition</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>{error || 'Petition not found or is inactive.'}</p>
        <button onClick={() => fetchPetition(true)} className="btn btn-primary">Try Again</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 16px', display: 'flex', flexDirection: 'column' }} className="animate-fade-in">
      <div className="glass-panel" style={{ padding: '32px', marginBottom: '24px', order: 2 }}>
        <h1 className="title-gradient" style={{ fontSize: '2.2rem', fontWeight: 700, marginBottom: '16px', lineHeight: 1.2 }}>
          {petition.title}
        </h1>

        {(petition.image_data || petition.image_url) && (
          <div className="petition-detail-image" style={{ width: '100%', height: '280px', borderRadius: '8px', overflow: 'hidden', marginBottom: '24px', border: '1px solid var(--border-color)', position: 'relative', backgroundColor: '#161616' }}>
            <img 
              src={petition.image_data || petition.image_url || undefined} 
              alt={petition.title} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              onError={(e) => {
                e.currentTarget.src = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=300&auto=format&fit=crop";
              }}
            />
            {petition.eye_label && (
              <div style={{ 
                position: 'absolute', 
                top: '50%', 
                left: 0, 
                width: '100%', 
                height: '48px', 
                backgroundColor: '#000000', 
                transform: 'translateY(-50%)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                borderTop: '1px solid #222222',
                borderBottom: '1px solid #222222'
              }}>
                <span style={{ 
                  color: '#ffffff', 
                  fontSize: '0.85rem', 
                  fontWeight: 900, 
                  letterSpacing: '8px', 
                  textTransform: 'uppercase',
                  paddingLeft: '8px'
                }}>
                  {petition.eye_label}
                </span>
              </div>
            )}
          </div>
        )}
        
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '24px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Users size={16} style={{ color: 'var(--primary)' }} />
            <strong style={{ color: 'var(--text-primary)', fontSize: '1.05rem' }}>{petition.signature_count.toLocaleString()}</strong> signatures collected
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={16} style={{ color: 'var(--primary)' }} />
            Created on {new Date(petition.created_at).toLocaleDateString()}
          </div>
        </div>

        {/* Goal progress tracking bar */}
        <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 700 }}>
            <span><strong style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>{petition.signature_count.toLocaleString()}</strong> signed</span>
            <span>Goal: {petition.goal.toLocaleString()}</span>
          </div>
          <div className="progress-shimmer" style={{ height: '8px', backgroundColor: '#141414', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ 
              height: '100%', 
              width: `${Math.min((petition.signature_count / (petition.goal || 5000)) * 100, 100)}%`, 
              background: 'linear-gradient(90deg, #b91c1c 0%, #ef4444 100%)',
              borderRadius: '4px' 
            }} />
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>
            Help us reach our target of {petition.goal.toLocaleString()} verified signatures!
          </span>
        </div>

        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '1.05rem', whiteSpace: 'pre-wrap', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
          {petition.description}
        </p>
      </div>

      <div className="glass-panel" style={{ padding: '32px', marginBottom: '24px', order: 1 }}>
        {actionError && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', borderRadius: '8px', marginBottom: '20px', color: '#fca5a5', fontSize: '0.9rem' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{actionError}</span>
          </div>
        )}

        {step === 'details' && (
          <form onSubmit={handleSubmitSignature}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Smartphone size={20} style={{ color: 'var(--primary)' }} /> Join this Petition
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={firstName} 
                  onChange={e => setFirstName(e.target.value)} 
                  placeholder="John" 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={lastName} 
                  onChange={e => setLastName(e.target.value)} 
                  placeholder="Doe" 
                  required 
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              <div className="form-group">
                <label className="form-label">Age</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={age} 
                  onChange={e => setAge(e.target.value)} 
                  placeholder="18" 
                  min="1"
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">City</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={city} 
                  onChange={e => setCity(e.target.value)} 
                  placeholder="Mumbai" 
                  required 
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              <div className="form-group">
                <label className="form-label">Pincode</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={pincode} 
                  onChange={e => setPincode(e.target.value)} 
                  placeholder="400001" 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">State</label>
                <select
                  className="form-input"
                  value={stateName}
                  onChange={e => setStateName(e.target.value)}
                  required
                >
                  <option value="">Select State / Union Territory</option>
                  {INDIA_STATES_AND_UNION_TERRITORIES.map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Country</label>
              <input 
                type="text" 
                className="form-input" 
                value={country} 
                readOnly
                aria-readonly="true"
                required 
              />
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">Phone Number</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div className="form-input" style={{ width: '82px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                  +91
                </div>
                <input
                  type="tel"
                  className="form-input"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="9876543210"
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  required
                />
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Enter your 10-digit Indian mobile number.
              </span>
            </div>

            <div style={{ marginTop: '24px', marginBottom: '24px' }}>
              <label className="form-label">Petition Terms & Conditions (India Jurisdiction)</label>
              <div style={{ 
                height: '220px', 
                overflowY: 'scroll', 
                border: '1px solid var(--border-color)', 
                borderRadius: '8px', 
                padding: '16px', 
                backgroundColor: 'rgba(0,0,0,0.3)', 
                fontSize: '0.8rem', 
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
                textAlign: 'left'
              }}>
                <h4 style={{ color: '#ffffff', marginBottom: '4px', fontWeight: 700 }}>PETITION TERMS & CONDITIONS</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px' }}>Template v1.0 — India Jurisdiction</p>
                
                <p style={{ fontWeight: 700, color: '#ffffff', textTransform: 'uppercase' }}>TERMS AND CONDITIONS OF PARTICIPATION</p>
                <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>ELECTRONIC PETITION SIGNATURE AGREEMENT</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Applicable to All Petitions Conducted on This Platform · Jurisdiction: Republic of India</p>
                <br />
                
                <p style={{ color: '#ffffff', fontWeight: 600 }}>IMPORTANT NOTICE — READ CAREFULLY BEFORE SIGNING</p>
                <p>By clicking 'I Agree' and submitting your details on this platform, you are entering into a legally binding agreement. You confirm that you have read, understood, and voluntarily accept all terms stated herein. If you do not agree, do not proceed with signing the petition.</p>
                <br />
                
                <p><strong>Petition Title:</strong> {petition.title}</p>
                <p><strong>Petition Organiser:</strong> ADLFRONT</p>
                <p><strong>Petition Objective:</strong> Support and Demands as specified in the petition detail</p>
                <p><strong>Addressed To:</strong> Relevant Recipient Authority</p>
                <p><strong>Governing Law:</strong> Laws of the Republic of India</p>
                <p><strong>Last Updated:</strong> {new Date(petition.created_at).toLocaleDateString()}</p>
                <br />
                
                <h5 style={{ color: '#ffffff', fontWeight: 700, marginTop: '16px', marginBottom: '8px' }}>1. DEFINITIONS</h5>
                <p>• <strong>Platform</strong>: The online petition web application and all associated digital services provided by the organiser.</p>
                <p>• <strong>Petition</strong>: The specific electronic petition identified above, including its title, objective, and full description as published on the Platform.</p>
                <p>• <strong>Organiser</strong>: The individual, organisation, NGO, registered society, or other entity that has created and published the Petition on the Platform.</p>
                <p>• <strong>Signatory / You</strong>: Any natural person who accesses the Platform and submits their personal details to sign the Petition.</p>
                <p>• <strong>Electronic Signature</strong>: Your act of submitting your first name, last name, and verified mobile phone number constitutes your electronic signature on this Petition, as recognised under the Information Technology Act, 2000.</p>
                <p>• <strong>Personal Data</strong>: Your first name, last name, mobile phone number, IP address, and the timestamp of your signature submission, collectively collected and stored by the Platform.</p>
                <p>• <strong>T&C / Agreement</strong>: These Terms and Conditions of Participation in their entirety.</p>
                <br />
                
                <h5 style={{ color: '#ffffff', fontWeight: 700, marginTop: '16px', marginBottom: '8px' }}>2. NATURE AND LEGAL EFFECT OF SIGNING</h5>
                <p>2.1 By submitting this Petition, you are making a formal and voluntary declaration of support for the Petition's stated objective. Your submission constitutes your electronic signature as defined under Section 2(ta) and Section 5 of the Information Technology Act, 2000 (as amended), and shall carry equivalent legal weight to a physical signature for the purpose of this Petition.</p>
                <p>2.2 Your signature on this Petition signifies that you:</p>
                <p>• Have read and fully understood the Petition's title, objective, and description as published on the Platform.</p>
                <p>• Voluntarily and without coercion choose to associate your name and identity with the cause stated in the Petition.</p>
                <p>• Agree that the Organiser may present your name (first and last name) as a signatory of this Petition to the authority, body, or institution identified as the recipient.</p>
                <p>• Consent to the collection, storage, and use of your Personal Data in the manner described in Section 6 of this Agreement.</p>
                <p>• Confirm that you are of sound mind and at least 18 (eighteen) years of age, or have the explicit consent of a parent or legal guardian if you are a minor.</p>
                <p>• Confirm that you are a citizen or resident of the Republic of India, or are otherwise legally entitled to participate in the activities described in this Petition.</p>
                <p>2.3 Your signature does not constitute a financial commitment, transfer of property, or any obligation beyond the voluntary expression of support for the Petition.</p>
                <p>2.4 The Organiser makes no guarantee or representation that the Petition will achieve its stated objective. Signing is an act of civic expression, not a contract for any specific outcome.</p>
                <br />
                
                <h5 style={{ color: '#ffffff', fontWeight: 700, marginTop: '16px', marginBottom: '8px' }}>3. ELIGIBILITY TO SIGN</h5>
                <p>3.1 To be eligible to sign this Petition, you must satisfy ALL of the following conditions:</p>
                <p>• You must be a natural person (not a company, bot, or automated system).</p>
                <p>• You must be at least 18 (eighteen) years of age. If you are between 13 and 18 years of age, you may sign only with the written consent of a parent or legal guardian.</p>
                <p>• You must possess a valid Indian mobile phone number that is registered in your own name and to which you have genuine access.</p>
                <p>• You must not sign the same Petition more than once. The Platform enforces one signature per verified mobile number per Petition.</p>
                <p>• You must not use any false, misleading, or another person's identity when signing.</p>
                <p>3.2 The Organiser reserves the right to disqualify or remove any signature that is found to be fraudulent, duplicate, made using a false identity, or otherwise in violation of these Terms, without prior notice.</p>
                <p>3.3 Providing false personal information when signing this Petition may constitute an offence under Section 66C and Section 66D of the Information Technology Act, 2000, and may also attract liability under Section 420 of the Indian Penal Code, 1860 (now the Bharatiya Nyaya Sanhita, 2023) for cheating and impersonation.</p>
                <br />
                
                <h5 style={{ color: '#ffffff', fontWeight: 700, marginTop: '16px', marginBottom: '8px' }}>4. SIGNATORY DECLARATIONS AND WARRANTIES</h5>
                <p>By completing and submitting this Petition, you expressly declare and warrant the following:</p>
                <p>• <strong>D1 (True Identity)</strong>: The first name, last name, and mobile number you have provided are your own true and accurate personal details.</p>
                <p>• <strong>D2 (Voluntary Participation)</strong>: You are signing of your own free will, without coercion, bribery, or undue influence from any person or entity.</p>
                <p>• <strong>D3 (Genuine Support)</strong>: You genuinely support the cause, demand, or position stated in this Petition and are not signing on behalf of another person without their explicit and informed consent.</p>
                <p>• <strong>D4 (Legal Capacity)</strong>: You have full legal capacity to enter into this Agreement. If you are a minor, you confirm that a parent or legal guardian has provided their explicit consent to your participation.</p>
                <p>• <strong>D5 (Single Signature)</strong>: You have not and will not attempt to sign this specific Petition more than once, whether using the same or different contact details.</p>
                <p>• <strong>D6 (No Harmful Intent)</strong>: Your participation in this Petition is not intended to harass, defame, incite violence against, or cause unlawful harm to any individual, community, religious group, or institution.</p>
                <p>• <strong>D7 (Lawful Purpose)</strong>: To the best of your knowledge, the Petition and its objective do not violate any law of the Republic of India, including but not limited to the Bharatiya Nyaya Sanhita 2023, the Unlawful Activities (Prevention) Act 1967, the Representation of the People Act 1951, or any applicable State law.</p>
                <br />
                
                <h5 style={{ color: '#ffffff', fontWeight: 700, marginTop: '16px', marginBottom: '8px' }}>5. DATA PRIVACY AND PROTECTION OF PERSONAL INFORMATION</h5>
                <p>5.1 <strong>Legal Framework</strong>: The collection and processing of your Personal Data is governed by the Digital Personal Data Protection Act, 2025 (DPDP Act) and, where applicable, the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011. The Organiser acts as the Data Fiduciary under the DPDP Act in relation to your Personal Data.</p>
                <p>5.2 <strong>What Personal Data We Collect</strong>: First Name, Last Name, Mobile Phone Number, IP Address, User Agent string, and Date/time of signature submission. We do not collect Aadhaar, PAN, financial info, or biometric data.</p>
                <p>5.3 <strong>Purpose of Data Collection (Lawful Basis)</strong>: To verify identity, prevent fraud, record signature, present name to recipient authority, prevent duplicates, and maintain audit trail. Data will NOT be sold or used for marketing.</p>
                <p>5.4 <strong>Data Retention</strong>: Retained for the duration of the Petition and up to 2 years thereafter for legal compliance, then securely deleted or anonymised.</p>
                <p>5.5 <strong>Data Storage and Security</strong>: Stored on secured servers within the Republic of India. Encrypted at rest (AES-256) and in transit (TLS 1.3). Restricted access.</p>
                <p>5.6 <strong>Your Rights as a Data Principal</strong>: Right to Access, Right to Correction, Right to Erasure, Right to Withdraw Consent, Right to Grievance Redressal, and Right to Nominate.</p>
                <p>5.7 <strong>Data Grievance Officer</strong>: Contact the Grievance Officer at contact@adlfront.com. Grievances will be addressed within 30 days.</p>
                <p>5.8 If you believe your data rights have been violated and your grievance has not been satisfactorily resolved, you may approach the Data Protection Board of India.</p>
                <br />
                
                <h5 style={{ color: '#ffffff', fontWeight: 700, marginTop: '16px', marginBottom: '8px' }}>6. OBLIGATIONS OF THE ORGANISER</h5>
                <p>• To use the collected signatures exclusively for the stated purpose of this Petition and not for any other commercial, political, or personal purpose unrelated to the Petition.</p>
                <p>• To present the Petition and its signatures truthfully and accurately to the intended recipient, without misrepresentation.</p>
                <p>• To protect the Personal Data of Signatories with reasonable technical and security measures.</p>
                <p>• To not sell, rent, trade, or commercially exploit the Personal Data of any Signatory.</p>
                <p>• To respond to grievances from Signatories regarding their Personal Data within 30 days.</p>
                <p>• To delete or anonymise Personal Data upon the expiry of the retention period.</p>
                <p>• To ensure that the Petition's content does not violate any law of the Republic of India, including laws relating to communal harmony or defamation.</p>
                <br />
                
                <h5 style={{ color: '#ffffff', fontWeight: 700, marginTop: '16px', marginBottom: '8px' }}>7. PROHIBITED CONDUCT</h5>
                <p>• Signing on behalf of another person without consent.</p>
                <p>• Using automated scripts, bots, or non-human methods.</p>
                <p>• Providing a false name or another person's phone number.</p>
                <p>• Signing multiple times using different mobile numbers.</p>
                <p>• Submitting content promoting violence, terrorism, obscenity, or prohibited acts under BNS 2023 / UAPA 1967.</p>
                <p>• Using this Platform to harass, defame, or intimidate any individual or group.</p>
                <br />
                
                <h5 style={{ color: '#ffffff', fontWeight: 700, marginTop: '16px', marginBottom: '8px' }}>8. DISCLAIMER OF LIABILITY</h5>
                <p>8.1 The Organiser and the Platform do not guarantee any specific outcome or response from any authority.</p>
                <p>8.2 The Platform shall not be liable for any indirect, incidental, or consequential loss suffered by a Signatory.</p>
                <p>8.3 The Platform shall not be liable for technical failures, downtime, or loss of data caused by circumstances beyond its control.</p>
                <p>8.4 Each Signatory is solely responsible for ensuring their participation does not violate any law or rule applicable to them personally.</p>
                <br />
                
                <h5 style={{ color: '#ffffff', fontWeight: 700, marginTop: '16px', marginBottom: '8px' }}>9. GOVERNING LAW AND DISPUTE RESOLUTION</h5>
                <p>9.1 Governing Law: This Agreement is governed by the laws of the Republic of India, including the IT Act 2000, DPDP Act 2025, Indian Contract Act 1872, and BNS 2023.</p>
                <p>9.2 Jurisdiction: Subject to the exclusive jurisdiction of the courts located in New Delhi, India.</p>
                <p>9.3 Amicable Resolution: Parties agree to attempt resolution through good-faith negotiation for at least 30 days before initiating legal proceedings.</p>
                <br />
                
                <h5 style={{ color: '#ffffff', fontWeight: 700, marginTop: '16px', marginBottom: '8px' }}>10. MODIFICATIONS TO THESE TERMS</h5>
                <p>10.1 The Organiser reserves the right to modify these Terms at any time by updating the date on the Petition page.</p>
                <p>10.2 Pre-existing signatures remain valid under the version in force at the time of signing.</p>
                <p>10.3 If you do not agree with modified terms, you can request deletion of your data under Section 5.6.</p>
                <br />
                
                <h5 style={{ color: '#ffffff', fontWeight: 700, marginTop: '16px', marginBottom: '8px' }}>11. GENERAL PROVISIONS</h5>
                <p>11.1 Severability: If any provision is invalid, it is severed and the rest remain valid.</p>
                <p>11.2 Entire Agreement: This constitutes the entire agreement between the Signatory and Organiser.</p>
                <p>11.3 Waiver: Failure to enforce any right does not constitute a waiver.</p>
                <p>11.4 Language: Drafted in English. English version shall prevail in case of conflicts.</p>
                <p>11.5 No Agency: Does not create any employment, partnership, or agency relationship.</p>
                <br />
                
                <h5 style={{ color: '#ffffff', fontWeight: 700, marginTop: '16px', marginBottom: '8px' }}>DECLARATION OF ACCEPTANCE</h5>
                <p>✔ I have read and understood all 11 sections of these Terms and Conditions in full.</p>
                <p>✔ I voluntarily consent to the recording of my electronic signature on this Petition.</p>
                <p>✔ I consent to the collection and processing of my Personal Data as described in Section 5.</p>
                <p>✔ I understand that my submission constitutes an electronic signature as recognised under the Information Technology Act, 2000.</p>
                <p>✔ I confirm all declarations made under Section 4 of this Agreement are true and accurate.</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '12px' }}>
                <input 
                  type="checkbox" 
                  id="agree-checkbox" 
                  checked={agreedTerms} 
                  onChange={e => setAgreedTerms(e.target.checked)} 
                  style={{ marginTop: '3px', cursor: 'pointer' }}
                />
                <label htmlFor="agree-checkbox" style={{ fontSize: '0.85rem', color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left', lineHeight: 1.4 }}>
                  <strong>I Agree to the Terms and Conditions</strong> and confirm that my submission constitutes an electronic signature under the Information Technology Act, 2000.
                </label>
              </div>
            </div>

            {/* Captcha challenge field */}
            {captcha && (
              <div className="form-group" style={{ marginBottom: '24px', padding: '16px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Security verification (Anti-Bot Captcha)</span>
                  <button type="button" onClick={loadCaptcha} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>
                    Reload Challenge
                  </button>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px' }}>
                  <div style={{ backgroundColor: '#141414', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px 16px', fontWeight: 800, color: '#ffffff', letterSpacing: '1px', fontSize: '1.05rem', minWidth: '130px', textAlign: 'center' }}>
                    {captcha.question}
                  </div>
                  <input 
                    type="text"
                    className="form-input"
                    style={{ flex: 1, textAlign: 'center', fontSize: '1.1rem', fontWeight: 700 }}
                    value={captchaAnswer}
                    onChange={e => setCaptchaAnswer(e.target.value)}
                    placeholder="Your Answer"
                    required
                  />
                </div>
              </div>
            )}

            {/* Proof of Work Altcha Verification */}
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">Security verification (Proof of Work)</label>
              <altcha-widget
                ref={altchaRef}
                challengeurl="/api/altcha/challenge"
                auto="onload"
                style={{
                  '--altcha-bg-color': 'rgba(255,255,255,0.02)',
                  '--altcha-border-color': 'var(--border-color)',
                  '--altcha-text-color': '#ffffff',
                  '--altcha-primary-color': '#ef4444',
                  '--altcha-width': '100%',
                  'display': 'block',
                  'borderRadius': '8px',
                  'overflow': 'hidden',
                  'marginTop': '8px'
                } as any}
              ></altcha-widget>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '12px' }} 
              disabled={submitting || !agreedTerms || !captchaAnswer.trim() || !altchaVerified}
            >
              {submitting ? <Loader2 size={18} className="animate-spin" /> : 'Submit Signature'}
            </button>
          </form>
        )}

        {step === 'success' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }} className="animate-fade-in">
            <CheckCircle size={64} style={{ color: 'var(--success)', marginBottom: '20px' }} />
            <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '12px' }}>Thank You, {firstName}!</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginBottom: '24px', maxWidth: '500px', margin: '0 auto 24px' }}>
              Your signature has been successfully recorded. Your support makes a difference!
            </p>
            <button onClick={() => {
              setFirstName('');
              setLastName('');
              setAge('');
              setCity('');
              setPincode('');
              setStateName('');
              setPhone('');
              setAgreedTerms(false);
              setStep('details');
            }} className="btn btn-secondary">
              Sign Another
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
