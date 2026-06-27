import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Shield, FileText, Scale, Landmark } from 'lucide-react';

type TabType = 'it-act' | 'dpdp' | 'jurisdiction';

export default function LegalView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as TabType) || 'it-act';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  const selectTab = (tab: TabType) => {
    setSearchParams({ tab });
  };

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', padding: '0 16px' }} className="animate-fade-in">
      <div className="glass-panel" style={{ padding: '40px', marginBottom: '32px' }}>
        <h1 className="title-gradient" style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Scale size={36} style={{ color: '#ef4444' }} /> Legal & Compliance
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.5 }}>
          ADLFRONT is committed to absolute compliance with the digital laws of the Republic of India. Read our legal frameworks, compliance declarations, and data protection policies below.
        </p>

        {/* Tab Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '32px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <button 
            onClick={() => selectTab('it-act')}
            className={`btn ${activeTab === 'it-act' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '0.85rem' }}
          >
            <Landmark size={16} /> IT Act 2000 Compliance
          </button>
          <button 
            onClick={() => selectTab('dpdp')}
            className={`btn ${activeTab === 'dpdp' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '0.85rem' }}
          >
            <Shield size={16} /> Privacy Policy (DPDP Act)
          </button>
          <button 
            onClick={() => selectTab('jurisdiction')}
            className={`btn ${activeTab === 'jurisdiction' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '0.85rem' }}
          >
            <FileText size={16} /> Terms & Jurisdiction
          </button>
        </div>

        {/* Tab Contents */}
        <div style={{ marginTop: '32px', textAlign: 'left', lineHeight: 1.7, color: 'var(--text-secondary)', fontSize: '0.95rem' }} className="animate-fade-in">
          
          {/* IT ACT TAB */}
          {activeTab === 'it-act' && (
            <div style={{ animation: 'fadeInUp 0.3s ease' }}>
              <h2 style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: 800, marginBottom: '20px', textTransform: 'uppercase' }}>
                Information Technology Act, 2000 Compliance
              </h2>
              <div style={{ padding: '16px', backgroundColor: 'rgba(239,68,68,0.03)', borderLeft: '4px solid #ef4444', borderRadius: '4px', marginBottom: '24px' }}>
                <strong style={{ color: '#ffffff' }}>Legal Summary:</strong> Electronic signatures validated via One-Time Passwords (OTP) sent to verified mobile numbers carry full legal validity under Section 2(ta) and Section 5 of the Information Technology Act, 2000.
              </div>
              
              <h3 style={{ color: '#ffffff', fontSize: '1.15rem', fontWeight: 700, marginTop: '24px', marginBottom: '12px' }}>1. Recognition of Electronic Signatures</h3>
              <p>
                Under Section 5 of the IT Act, 2000, where any law requires information or any other matter to be authenticated by affixing the signature, then, notwithstanding anything contained in such law, such requirement shall be deemed to have been satisfied if such information or matter is authenticated by means of an electronic signature affixed in such manner as may be prescribed by the Central Government.
              </p>
              
              <h3 style={{ color: '#ffffff', fontSize: '1.15rem', fontWeight: 700, marginTop: '24px', marginBottom: '12px' }}>2. Identity Verification and OTP Validation</h3>
              <p>
                Our platform integrates a high-trust verification flow. By registering your first name, last name, and verifying your active mobile phone number via a secure 6-digit SMS One-Time Password (OTP), you establish a unique link between your identity and the signature submission, satisfying the reliability standards under Section 15 of the IT Act, 2000 for secure electronic signatures.
              </p>

              <h3 style={{ color: '#ffffff', fontSize: '1.15rem', fontWeight: 700, marginTop: '24px', marginBottom: '12px' }}>3. Audit Trails & Tamper Evidence</h3>
              <p>
                To preserve integrity, each signature payload records the verified mobile number hash, the user IP address, user-agent details, and a cryptographic timestamp. Once signed, the audit trail is encrypted and locked in our database. Any subsequent modification of campaign details or signatory logs is rendered instantly detectable, ensuring compliance with Section 15(b) regarding data integrity.
              </p>
            </div>
          )}

          {/* DPDP ACT TAB */}
          {activeTab === 'dpdp' && (
            <div style={{ animation: 'fadeInUp 0.3s ease' }}>
              <h2 style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: 800, marginBottom: '20px', textTransform: 'uppercase' }}>
                Privacy Policy & DPDP Act 2025 Compliance
              </h2>
              <div style={{ padding: '16px', backgroundColor: 'rgba(16,185,129,0.03)', borderLeft: '4px solid #10b981', borderRadius: '4px', marginBottom: '24px' }}>
                <strong style={{ color: '#ffffff' }}>Data Protection:</strong> In complete adherence to the Digital Personal Data Protection Act, 2025 (DPDP Act), ADLFRONT acts as the Data Fiduciary. We process personal data solely on a lawful, consensual basis.
              </div>

              <h3 style={{ color: '#ffffff', fontSize: '1.15rem', fontWeight: 700, marginTop: '24px', marginBottom: '12px' }}>1. Scope of Data Collection</h3>
              <p>
                To confirm the authenticity of signatures, we collect the following minimum data categories:
              </p>
              <ul style={{ paddingLeft: '20px', margin: '12px 0' }}>
                <li>• First Name & Last Name (Identity authentication)</li>
                <li>• Age, City, Pincode, State & Country (Demographic residency validation)</li>
                <li>• Mobile Phone Number (OTP validation and uniqueness constraints)</li>
                <li>• System IP Address & Signature Timestamp (Security auditing logs)</li>
              </ul>

              <h3 style={{ color: '#ffffff', fontSize: '1.15rem', fontWeight: 700, marginTop: '24px', marginBottom: '12px' }}>2. Data Fiduciary Responsibilities</h3>
              <p>
                As a registered Data Fiduciary, ADLFRONT guarantees:
              </p>
              <ul style={{ paddingLeft: '20px', margin: '12px 0' }}>
                <li>• <strong>No Sharing/Selling</strong>: We never lease, trade, or sell personal information to third parties.</li>
                <li>• <strong>Encryption Standards</strong>: All data is encrypted in transit using TLS 1.3 and at rest using AES-256 standards.</li>
                <li>• <strong>Domestic Storage</strong>: Consonant with sovereign guidelines, all personal data is stored exclusively on secure cloud infrastructure located within the borders of the Republic of India.</li>
              </ul>

              <h3 style={{ color: '#ffffff', fontSize: '1.15rem', fontWeight: 700, marginTop: '24px', marginBottom: '12px' }}>3. Rights of the Data Principal</h3>
              <p>
                Under Chapter III of the DPDP Act 2025, you possess the:
              </p>
              <ul style={{ paddingLeft: '20px', margin: '12px 0' }}>
                <li>• Right to access summary of your personal data collected.</li>
                <li>• Right to correction or update of details.</li>
                <li>• Right to erasure/deletion of your signature from any campaign.</li>
                <li>• Right to lodge grievances with our Data Grievance Officer.</li>
              </ul>
              <p style={{ marginTop: '16px' }}>
                For data erasure requests or compliance questions, contact our Grievance Officer at: <strong style={{ color: '#ffffff' }}>grievance@adlfront.org</strong>.
              </p>
            </div>
          )}

          {/* JURISDICTION TAB */}
          {activeTab === 'jurisdiction' && (
            <div style={{ animation: 'fadeInUp 0.3s ease' }}>
              <h2 style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: 800, marginBottom: '20px', textTransform: 'uppercase' }}>
                Terms of Participation & Legal Jurisdiction
              </h2>
              <div style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.02)', borderLeft: '4px solid #ffffff', borderRadius: '4px', marginBottom: '24px' }}>
                <strong style={{ color: '#ffffff' }}>Jurisdiction:</strong> The Platform is subject exclusively to the federal laws of the Republic of India. All actions, submissions, and disputes shall be governed in accordance with Indian legal statutes.
              </div>

              <h3 style={{ color: '#ffffff', fontSize: '1.15rem', fontWeight: 700, marginTop: '24px', marginBottom: '12px' }}>1. Signatory Warranties</h3>
              <p>
                By signing a petition on this platform, you warrant that you are a citizen or resident of India, are of sound mind, are at least 18 years of age (or have explicit parental guidance), and that all information entered is true, accurate, and belongs to you.
              </p>

              <h3 style={{ color: '#ffffff', fontSize: '1.15rem', fontWeight: 700, marginTop: '24px', marginBottom: '12px' }}>2. Forbidden Activities & Impersonation</h3>
              <p>
                Any attempt to manipulate signature counts, sign using automated bots, scrape public pages, or impersonate another person using a phone number that is not registered in your name is strictly prohibited. Impersonation and fraud constitute offences under Section 66C and Section 66D of the IT Act, 2000, and Section 420/319 of the Bharatiya Nyaya Sanhita (BNS), 2023, and will be reported to cyber authorities.
              </p>

              <h3 style={{ color: '#ffffff', fontSize: '1.15rem', fontWeight: 700, marginTop: '24px', marginBottom: '12px' }}>3. Jurisdiction & Dispute Resolution</h3>
              <p>
                You agree that any dispute, claim, or controversy arising out of your participation in petitions, use of this Platform, or interpretation of this agreement shall be governed by the laws of India, and shall be subject to the exclusive jurisdiction of the competent courts of New Delhi, India.
              </p>
            </div>
          )}

        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <a href="/" className="btn btn-secondary" style={{ padding: '10px 24px', fontSize: '0.85rem' }}>
          Return to Home Page
        </a>
      </div>
    </div>
  );
}
