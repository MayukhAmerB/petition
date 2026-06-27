import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../core/api';
import { 
  Plus, 
  Download, 
  Search, 
  Copy, 
  LogOut, 
  ExternalLink, 
  Loader2, 
  AlertCircle,
  FileText,
  Users,
  Check,
  CheckCircle
} from 'lucide-react';

interface Signature {
  id: string;
  petition_id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  signed_at: string;
  ip_address: string | null;
  user_agent: string | null;
}

interface CreatedPetition {
  id: string;
  title: string;
}

interface AdminPetition {
  id: string;
  title: string;
  description: string;
  signature_count: number;
  is_active: boolean;
  created_at: string;
  image_data?: string | null;
  eye_label?: string | null;
  goal: number;
}

export default function DashboardView() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'create' | 'signatures' | 'manage'>('manage');
  
  // Petition creation form states
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [eyeLabel, setEyeLabel] = useState('');
  const [description, setDescription] = useState('');
  const [terms, setTerms] = useState('');
  const [goal, setGoal] = useState('5000');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Petition management states
  const [adminPetitions, setAdminPetitions] = useState<AdminPetition[]>([]);
  const [manageLoading, setManageLoading] = useState(false);
  const [manageError, setManageError] = useState<string | null>(null);

  // Local storage history of created petitions for convenient dropdown selection
  const [petitionHistory, setPetitionHistory] = useState<CreatedPetition[]>([]);
  const [selectedPetitionId, setSelectedPetitionId] = useState('');
  const [manualPetitionId, setManualPetitionId] = useState('');
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [sigLoading, setSigLoading] = useState(false);
  const [sigError, setSigError] = useState<string | null>(null);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    // Load created petitions history
    const history = localStorage.getItem('created_petitions_history');
    if (history) {
      try {
        const parsed = JSON.parse(history);
        setPetitionHistory(parsed);
        if (parsed.length > 0) {
          setSelectedPetitionId(parsed[0].id);
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, [navigate]);

  const handleLoadAdminPetitions = async () => {
    setManageLoading(true);
    setManageError(null);
    try {
      const data = await api.get<AdminPetition[]>('/admin/petition/list');
      setAdminPetitions(data);
    } catch (err) {
      setManageError((err as any).message || 'Failed to load petitions.');
    } finally {
      setManageLoading(false);
    }
  };

  const handleToggleActive = async (petitionId: string, currentStatus: boolean) => {
    try {
      await api.post(`/admin/petition/${petitionId}/toggle`, { is_active: !currentStatus });
      setAdminPetitions(prev => prev.map(p => 
        p.id === petitionId ? { ...p, is_active: !currentStatus } : p
      ));
    } catch (err) {
      alert((err as any).message || 'Failed to toggle active status.');
    }
  };

  const handleUpdateGoal = async (petitionId: string) => {
    const inputEl = document.getElementById(`goal-input-${petitionId}`) as HTMLInputElement | null;
    if (!inputEl) return;
    const newGoalVal = Number(inputEl.value);
    if (!newGoalVal || newGoalVal <= 0) {
      alert("Please enter a valid positive signature goal.");
      return;
    }

    try {
      await api.post(`/admin/petition/${petitionId}/update-goal`, { goal: newGoalVal });
      alert("Petition goal updated successfully!");
      setAdminPetitions(prev => prev.map(p => 
        p.id === petitionId ? { ...p, goal: newGoalVal } : p
      ));
    } catch (err) {
      alert((err as any).message || 'Failed to update petition goal.');
    }
  };

  const handleDeletePetition = async (petitionId: string) => {
    if (!confirm("Are you sure you want to delete this petition? This will permanently delete the petition and ALL signatures associated with it. This action cannot be undone!")) {
      return;
    }
    try {
      await api.delete(`/admin/petition/${petitionId}`);
      setAdminPetitions(prev => prev.filter(p => p.id !== petitionId));
      
      const newHistory = petitionHistory.filter(p => p.id !== petitionId);
      setPetitionHistory(newHistory);
      localStorage.setItem('created_petitions_history', JSON.stringify(newHistory));
      if (selectedPetitionId === petitionId) {
        setSelectedPetitionId(newHistory.length > 0 ? newHistory[0].id : '');
      }
    } catch (err) {
      alert((err as any).message || 'Failed to delete petition.');
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) return;
    
    if (activeTab === 'manage') {
      handleLoadAdminPetitions();
    }
  }, [activeTab]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin/login');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Image is too large. Please select an image under 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Create Petition
  const handleCreatePetition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !terms.trim()) {
      setCreateError('All fields are required.');
      return;
    }

    setCreateLoading(true);
    setCreateError(null);
    setCreatedUrl(null);

    try {
      const res = await api.post<{ id: string; title: string }>('/admin/petition/create', {
        title,
        description,
        image_data: imageUrl.trim() || null,
        eye_label: eyeLabel.trim() || null,
        terms,
        goal: Number(goal) || 5000,
      });

      const rootUrl = window.location.origin;
      const url = `${rootUrl}/petition/${res.id}`;
      setCreatedUrl(url);
      setCreatedId(res.id);

      // Save to local history
      const newHistory = [{ id: res.id, title: res.title }, ...petitionHistory];
      setPetitionHistory(newHistory);
      localStorage.setItem('created_petitions_history', JSON.stringify(newHistory));
      setSelectedPetitionId(res.id);

      // Reset form
      setTitle('');
      setImageUrl('');
      setEyeLabel('');
      setDescription('');
      setTerms('');
      setGoal('5000');
    } catch (err) {
      setCreateError((err as any).message || 'Failed to create petition.');
    } finally {
      setCreateLoading(false);
    }
  };

  // Load signatures
  const handleLoadSignatures = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const targetId = activeTab === 'signatures' && manualPetitionId.trim() 
      ? manualPetitionId.trim() 
      : selectedPetitionId;

    if (!targetId) {
      setSigError('Please select or enter a valid petition ID.');
      return;
    }

    setSigLoading(true);
    setSigError(null);
    setSignatures([]);

    try {
      const data = await api.get<Signature[]>(`/admin/signatures/${targetId}`);
      setSignatures(data);
    } catch (err) {
      setSigError((err as any).message || 'Failed to load signatures. Please verify the ID.');
    } finally {
      setSigLoading(false);
    }
  };

  // Trigger search on tab change or dropdown change
  useEffect(() => {
    if (activeTab === 'signatures' && selectedPetitionId) {
      handleLoadSignatures();
    }
  }, [activeTab, selectedPetitionId]);

  // Helper to parse details
  const parseDetails = (lastName: string) => {
    try {
      if (lastName && lastName.startsWith('{')) {
        const parsed = JSON.parse(lastName);
        return {
          isVolunteer: true,
          age: parsed.age || '',
          city: parsed.city || '',
          pincode: parsed.pincode || '',
          state: parsed.state || '',
          country: parsed.country || ''
        };
      }
    } catch (e) {}
    return {
      isVolunteer: false,
      age: '',
      city: '',
      pincode: '',
      state: '',
      country: lastName || ''
    };
  };

  // Export to CSV
  const handleExportCsv = () => {
    if (signatures.length === 0) return;

    const headers = ['Volunteer ID', 'Full Name', 'Age', 'WhatsApp Number', 'City', 'Pincode', 'State', 'Country', 'Registered At', 'IP Address', 'User Agent'];
    const rows = signatures.map(s => {
      const details = parseDetails(s.last_name);
      return [
        s.id,
        s.first_name, // Full Name is stored in first_name
        details.age.toString(),
        s.phone_number,
        details.city,
        details.pincode,
        details.state,
        details.country,
        s.signed_at,
        s.ip_address || '',
        s.user_agent || ''
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    
    const petitionTitle = petitionHistory.find(p => p.id === selectedPetitionId)?.title || 'signatures';
    const filename = `volunteers_${petitionTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}.csv`;
    
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    if (!createdUrl) return;
    navigator.clipboard.writeText(createdUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 16px' }} className="animate-fade-in">
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 className="title-gradient" style={{ fontSize: '2rem', fontWeight: 700 }}>Admin Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Control panel for petition management</p>
        </div>
        <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
          <LogOut size={16} /> Sign Out
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '24px', paddingBottom: '1px' }}>
        <button 
          onClick={() => setActiveTab('manage')}
          className={`btn ${activeTab === 'manage' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: activeTab === 'manage' ? 'none' : undefined }}
        >
          <FileText size={16} /> Manage Petitions
        </button>
        <button 
          onClick={() => setActiveTab('create')}
          className={`btn ${activeTab === 'create' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: activeTab === 'create' ? 'none' : undefined }}
        >
          <Plus size={16} /> Create Petition
        </button>
        <button 
          onClick={() => setActiveTab('signatures')}
          className={`btn ${activeTab === 'signatures' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: activeTab === 'signatures' ? 'none' : undefined }}
        >
          <Users size={16} /> View Signatures
        </button>
      </div>

      {/* Tab Contents */}
      
      {/* Manage tab contents */}
      {activeTab === 'manage' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-fade-in">
          {manageError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', borderRadius: '8px', color: '#fca5a5', fontSize: '0.9rem' }}>
              <AlertCircle size={18} />
              <span>{manageError}</span>
            </div>
          )}

          {manageLoading ? (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
              <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary)', margin: '0 auto 12px' }} />
              <p>Loading petitions...</p>
            </div>
          ) : adminPetitions.length === 0 ? (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <p>No petitions found. Launch your first petition using the "Create Petition" tab.</p>
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)' }}>
                      <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Petition Title</th>
                      <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Signatures</th>
                      <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Goal Target</th>
                      <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Created At</th>
                      <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', textAlign: 'center' }}>Status</th>
                      <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminPetitions.map((p) => (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                          <div>{p.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span>ID: {p.id}</span>
                            <a href={`/petition/${p.id}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '2px' }}>
                              Link <ExternalLink size={10} />
                            </a>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-primary)', fontWeight: 600 }}>
                          {p.signature_count}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input 
                              type="number" 
                              className="form-input" 
                              key={p.id + '-' + p.goal}
                              defaultValue={p.goal || 5000} 
                              style={{ width: '80px', padding: '6px 12px', fontSize: '0.85rem', margin: 0 }}
                              id={`goal-input-${p.id}`}
                            />
                            <button 
                              onClick={() => handleUpdateGoal(p.id)}
                              className="btn btn-primary"
                              style={{ padding: '6px 12px', fontSize: '0.8rem', margin: 0 }}
                            >
                              Set
                            </button>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                          {new Date(p.created_at).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{ 
                            display: 'inline-block', 
                            padding: '2px 8px', 
                            borderRadius: '12px', 
                            fontSize: '0.75rem', 
                            fontWeight: 600,
                            backgroundColor: p.is_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: p.is_active ? 'var(--success)' : 'var(--danger)'
                          }}>
                            {p.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            <button 
                              onClick={() => handleToggleActive(p.id, p.is_active)} 
                              className="btn btn-secondary" 
                              style={{ padding: '4px 10px', fontSize: '0.75rem', margin: 0 }}
                            >
                              {p.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button 
                              onClick={() => {
                                setSelectedPetitionId(p.id);
                                setManualPetitionId('');
                                setActiveTab('signatures');
                              }} 
                              className="btn btn-secondary" 
                              style={{ padding: '4px 10px', fontSize: '0.75rem', margin: 0 }}
                            >
                              Signatures
                            </button>
                            <button 
                              onClick={() => handleDeletePetition(p.id)} 
                              className="btn btn-secondary" 
                              style={{ padding: '4px 10px', fontSize: '0.75rem', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.2)', margin: 0 }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'create' && (
        <div style={{ display: 'grid', gridTemplateColumns: createdUrl ? '1fr' : '1fr', gap: '24px' }}>
          {createdUrl && (
            <div className="glass-panel animate-fade-in" style={{ padding: '24px', border: '1px solid var(--success)', backgroundColor: 'rgba(16, 185, 129, 0.05)', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)', marginBottom: '12px' }}>
                <CheckCircle size={24} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Petition Created Successfully!</h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
                The petition has been initialized and is ready for signatures. Share the link below with the public:
              </p>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <input 
                  type="text" 
                  readOnly 
                  className="form-input" 
                  value={createdUrl} 
                  style={{ backgroundColor: 'rgba(0,0,0,0.3)', fontFamily: 'monospace', fontSize: '0.85rem' }} 
                />
                <button onClick={copyToClipboard} className="btn btn-secondary" style={{ whiteSpace: 'nowrap' }}>
                  {copied ? <Check size={18} style={{ color: 'var(--success)' }} /> : <Copy size={18} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <a href={`/petition/${createdId}`} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                  Open Public Page <ExternalLink size={14} />
                </a>
                <button onClick={() => setCreatedUrl(null)} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                  Create Another
                </button>
              </div>
            </div>
          )}

          {!createdUrl && (
            <form onSubmit={handleCreatePetition} className="glass-panel" style={{ padding: '32px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={20} style={{ color: 'var(--primary)' }} /> Setup a New Petition
              </h2>

              {createError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', borderRadius: '8px', marginBottom: '20px', color: '#fca5a5', fontSize: '0.9rem' }}>
                  <AlertCircle size={18} />
                  <span>{createError}</span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Petition Title</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  placeholder="e.g. Demand Clean Drinking Water in Sector 15" 
                  required 
                />
              </div>

               <div className="form-group">
                <label className="form-label">Campaign Image</label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <input 
                    type="file" 
                    accept="image/*" 
                    id="campaign-image-upload" 
                    onChange={handleImageUpload} 
                    style={{ display: 'none' }} 
                  />
                  <label 
                    htmlFor="campaign-image-upload" 
                    className="btn btn-secondary" 
                    style={{ cursor: 'pointer', margin: 0, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '6px', height: '45px' }}
                  >
                    Choose Local Image...
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    placeholder="Or paste image URL / Base64..."
                    style={{ flex: 1 }}
                  />
                </div>
                {imageUrl && (
                  <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                      <img 
                        src={imageUrl} 
                        alt="Preview" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        onError={(e) => {
                          e.currentTarget.src = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=300&auto=format&fit=crop";
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--success)' }}>✓ Campaign image loaded</span>
                    <button type="button" onClick={() => setImageUrl('')} className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '0.75rem' }}>Clear</button>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Eye Mask Label (e.g. NAZIA ELAHI)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={eyeLabel} 
                  onChange={e => setEyeLabel(e.target.value)} 
                  placeholder="Uppercase label to display on eye sensor bar..." 
                />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>
                  Optional. Text overlay shown on the black bar of the campaign card.
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Petition Goal (Signature Target)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={goal} 
                  onChange={e => setGoal(e.target.value)} 
                  placeholder="e.g. 5000" 
                  min="1"
                  required 
                />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>
                  The target number of signatures for the progress bar.
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Description (Main Purpose & Context)</label>
                <textarea 
                  className="form-input" 
                  style={{ minHeight: '120px', resize: 'vertical' }}
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  placeholder="Explain why this petition exists, the current situation, and the goals you want to achieve..." 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Terms and Conditions Text (Legal agreement for signers)</label>
                <textarea 
                  className="form-input" 
                  style={{ minHeight: '100px', resize: 'vertical', fontSize: '0.85rem' }}
                  value={terms} 
                  onChange={e => setTerms(e.target.value)} 
                  placeholder="e.g. By signing this document, I certify that I am a local resident and support the claims. I authorize the organizers to submit my name to the municipal authorities..." 
                  required 
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: '8px' }} disabled={createLoading}>
                {createLoading ? <Loader2 size={18} className="animate-spin" /> : 'Launch Petition'}
              </button>
            </form>
          )}
        </div>
      )}

      {activeTab === 'signatures' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-fade-in">
          {/* Controls */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'end' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Select from History</label>
                <select 
                  className="form-input"
                  value={selectedPetitionId}
                  onChange={e => {
                    setSelectedPetitionId(e.target.value);
                    setManualPetitionId('');
                  }}
                  disabled={petitionHistory.length === 0}
                >
                  {petitionHistory.length === 0 ? (
                    <option>No created petitions yet</option>
                  ) : (
                    petitionHistory.map(p => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))
                  )}
                </select>
              </div>

              <form onSubmit={handleLoadSignatures} style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Or Enter Petition UUID</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={manualPetitionId}
                    onChange={e => setManualPetitionId(e.target.value)}
                    placeholder="Enter Uuid..." 
                  />
                </div>
                <button type="submit" className="btn btn-secondary" style={{ height: '45px' }} disabled={sigLoading}>
                  {sigLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={18} />}
                  Search
                </button>
              </form>
            </div>
          </div>

          {/* Results log */}
          {sigError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', borderRadius: '8px', color: '#fca5a5', fontSize: '0.9rem' }}>
              <AlertCircle size={18} />
              <span>{sigError}</span>
            </div>
          )}

          {signatures.length > 0 && (
            <div className="glass-panel animate-fade-in" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={18} style={{ color: 'var(--primary)' }} />
                  <span style={{ fontWeight: 600 }}>{signatures.length} Signatures Logged</span>
                </div>
                <button onClick={handleExportCsv} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                  <Download size={14} /> Export to CSV
                </button>
              </div>

              {/* Table */}
              <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)' }}>
                      <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Name</th>
                      <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Age</th>
                      <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>WhatsApp Number</th>
                      <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Location (City, State, Pincode, Country)</th>
                      <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Registered At</th>
                      <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>IP Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {signatures.map((sig) => {
                      const details = parseDetails(sig.last_name);
                      return (
                        <tr key={sig.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '12px 16px', fontWeight: 500 }}>{sig.first_name}</td>
                          <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                            {details.isVolunteer ? details.age : '—'}
                          </td>
                          <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{sig.phone_number}</td>
                          <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                            {details.isVolunteer ? `${details.city}, ${details.state} - ${details.pincode}, ${details.country}` : '—'}
                          </td>
                          <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                            {new Date(sig.signed_at).toLocaleString()}
                          </td>
                          <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{sig.ip_address || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {signatures.length === 0 && !sigLoading && !sigError && (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Users size={32} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
              <p>No signatures found. Make sure the petition has collected signatures.</p>
            </div>
          )}

          {sigLoading && (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
              <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary)', margin: '0 auto 12px' }} />
              <p>Loading signatures data...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
