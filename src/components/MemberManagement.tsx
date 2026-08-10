import React, { useState, useEffect } from 'react';
import { Member, UserMetadata } from '../types';
import { memberService } from '../services/memberService';
import { storageService } from '../services/storageService';
import { auditService } from '../services/auditService';
import MembersAppModule from './MembersAppModule';
import { 
  Users, Search, Filter, Plus, Edit2, Eye, Archive, 
  CheckCircle2, AlertCircle, X, Shield, Phone, Mail, 
  MapPin, Calendar, FileText, Upload, Lock, User
} from 'lucide-react';

interface MemberManagementProps {
  currentUser: UserMetadata;
}

export const MemberManagement: React.FC<MemberManagementProps> = ({ currentUser }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Modals state
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Form fields
  const [formData, setFormData] = useState<Partial<Member>>({
    fullName: '',
    cin: '',
    phone: '',
    email: '',
    address: '',
    membershipType: 'Producteur',
    department: 'Agriculture & Agroécologie',
    status: 'ACTIVE',
    registrationDate: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Document / Photo Upload
  const [uploading, setUploading] = useState(false);

  // RBAC checks
  const canCreate = currentUser.role === 'ADMIN' || currentUser.role === 'COORDINATOR' || currentUser.permissions?.includes('members.create');
  const canEdit = currentUser.role === 'ADMIN' || currentUser.role === 'COORDINATOR' || currentUser.permissions?.includes('members.update');
  const canArchive = currentUser.role === 'ADMIN' || currentUser.permissions?.includes('members.archive');

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await memberService.getMembers();
      setMembers(data);
    } catch (err: unknown) {
      setError('Impossible de charger la liste des membres.');
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = memberService.searchMembers(members, searchQuery, statusFilter, typeFilter);

  const handleOpenCreateModal = () => {
    setFormData({
      fullName: '',
      cin: '',
      phone: '',
      email: '',
      address: '',
      membershipType: 'Producteur',
      department: 'Agriculture & Agroécologie',
      status: 'ACTIVE',
      registrationDate: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setIsEditMode(false);
    setFormError(null);
    setFormModalOpen(true);
  };

  const handleOpenEditModal = (member: Member) => {
    setSelectedMember(member);
    setFormData({ ...member });
    setIsEditMode(true);
    setFormError(null);
    setFormModalOpen(true);
  };

  const handleOpenViewModal = (member: Member) => {
    setSelectedMember(member);
    setViewModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);

    try {
      if (isEditMode && selectedMember) {
        const updated = await memberService.updateMember(selectedMember.id, formData);
        setSuccessMsg(`Membre ${updated.fullName} mis à jour avec succès.`);
        auditService.logEvent('ROLE_CHANGED', currentUser.email, currentUser.uid, `Mise à jour fiche membre: ${updated.id}`);
      } else {
        const created = await memberService.createMember({
          fullName: formData.fullName || '',
          cin: formData.cin || '',
          phone: formData.phone || '',
          email: formData.email || '',
          address: formData.address || '',
          membershipType: formData.membershipType as Member['membershipType'],
          department: formData.department || 'Général',
          status: formData.status as Member['status'],
          registrationDate: formData.registrationDate || new Date().toISOString().split('T')[0],
          notes: formData.notes || ''
        });
        setSuccessMsg(`Nouveau membre ${created.fullName} (${created.id}) enregistré avec succès.`);
        auditService.logEvent('ACCOUNT_APPROVED', currentUser.email, currentUser.uid, `Création membre: ${created.id}`);
      }

      setFormModalOpen(false);
      await loadMembers();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError('Une erreur est survenue lors de l\'enregistrement.');
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleArchiveMember = async (member: Member) => {
    if (!window.confirm(`Voulez-vous vraiment archiver la fiche du membre "${member.fullName}" ?`)) {
      return;
    }

    try {
      await memberService.archiveMember(member.id);
      setSuccessMsg(`Fiche membre ${member.fullName} archivée avec succès.`);
      auditService.logEvent('ACCOUNT_SUSPENDED', currentUser.email, currentUser.uid, `Archivage membre: ${member.id}`);
      await loadMembers();
    } catch (err) {
      setError('Erreur lors de l\'archivage de la fiche membre.');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !selectedMember) return;
    const file = e.target.files[0];
    setUploading(true);

    try {
      const uploadResult = await storageService.uploadFile(file, `members/${selectedMember.id}`);
      const updated = await memberService.updateMember(selectedMember.id, { photoUrl: uploadResult.url });
      setSelectedMember(updated);
      setSuccessMsg('Photo de profil mise à jour avec succès.');
      await loadMembers();
    } catch (err) {
      setError('Erreur lors du téléchargement de l\'image.');
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadge = (status: Member['status']) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Actif</span>;
      case 'PENDING':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">En Attente</span>;
      case 'SUSPENDED':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">Suspendu</span>;
      case 'INACTIVE':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">Inactif</span>;
      case 'ARCHIVED':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-100 text-gray-600 border border-gray-200">Archivé</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
            <Users className="w-4 h-4" />
            <span>Gestion Institutionnelle</span>
          </div>
          <h2 className="text-2xl font-serif font-extrabold text-slate-900 tracking-tight mt-1">
            Répertoire des Membres AMM
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Registre officiel des adhérents, producteurs, éleveurs et artisans de l'association.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-all shadow-md shrink-0"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Inscrire un Membre</span>
          </button>
        )}
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Global Error Notification */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-700 hover:text-rose-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
        
        {/* Search */}
        <div className="sm:col-span-6 relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom, CIN, e-mail, téléphone..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Status Filter */}
        <div className="sm:col-span-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="ACTIVE">Actif</option>
            <option value="PENDING">En Attente</option>
            <option value="SUSPENDED">Suspendu</option>
            <option value="INACTIVE">Inactif</option>
            <option value="ARCHIVED">Archivé</option>
          </select>
        </div>

        {/* Type Filter */}
        <div className="sm:col-span-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">Tous les types d'adhésion</option>
            <option value="Producteur">Producteur</option>
            <option value="Artisan">Artisan</option>
            <option value="Éleveur">Éleveur</option>
            <option value="Formateur">Formateur</option>
            <option value="Adhérent Sympathisant">Adhérent Sympathisant</option>
            <option value="Membre d'Honneur">Membre d'Honneur</option>
          </select>
        </div>

      </div>

      {/* Members Table */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 text-xs">
          Chargement du répertoire des membres...
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs space-y-1">
          <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <div className="font-bold text-slate-800">Aucun membre trouvé</div>
          <p>Ajustez vos filtres de recherche ou inscrivez un nouveau membre.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
          <table className="w-full text-left text-xs text-slate-700 bg-white">
            <thead className="bg-slate-900 text-slate-200 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Membre</th>
                <th className="py-3.5 px-4">CIN</th>
                <th className="py-3.5 px-4">Coordonnées</th>
                <th className="py-3.5 px-4">Type / Secteur</th>
                <th className="py-3.5 px-4">Date Inscription</th>
                <th className="py-3.5 px-4">Statut</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      {m.photoUrl ? (
                        <img src={m.photoUrl} alt={m.fullName} className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-900 font-bold flex items-center justify-center text-xs shrink-0">
                          {m.fullName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{m.fullName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{m.id}</div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-700">
                    {m.cin || 'Non renseigné'}
                  </td>

                  <td className="py-3.5 px-4 space-y-0.5">
                    <div className="text-slate-900 font-medium">{m.phone}</div>
                    <div className="text-[10px] text-slate-500">{m.email}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900">{m.membershipType}</div>
                    <div className="text-[10px] text-slate-500">{m.department || 'Général'}</div>
                  </td>

                  <td className="py-3.5 px-4 text-slate-600">
                    {m.registrationDate}
                  </td>

                  <td className="py-3.5 px-4">
                    {getStatusBadge(m.status)}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => handleOpenViewModal(m)}
                        className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Consulter la fiche"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {canEdit && (
                        <button
                          onClick={() => handleOpenEditModal(m)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Modifier la fiche"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}

                      {canArchive && m.status !== 'ARCHIVED' && (
                        <button
                          onClick={() => handleArchiveMember(m)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Archiver le membre"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW MEMBER MODAL */}
      {viewModalOpen && selectedMember && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white max-w-xl w-full rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 border border-slate-200">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                {selectedMember.photoUrl ? (
                  <img src={selectedMember.photoUrl} alt="" className="w-12 h-12 rounded-full object-cover border border-slate-200" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-emerald-900 text-white font-bold text-lg flex items-center justify-center">
                    {selectedMember.fullName.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-serif font-bold text-slate-900">{selectedMember.fullName}</h3>
                  <div className="text-xs text-slate-500 font-mono">{selectedMember.id}</div>
                </div>
              </div>
              <button onClick={() => setViewModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-slate-500 block mb-0.5">CIN :</span>
                <span className="font-bold text-slate-900 font-mono">{selectedMember.cin}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-slate-500 block mb-0.5">Statut :</span>
                <div>{getStatusBadge(selectedMember.status)}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-slate-500 block mb-0.5">Téléphone :</span>
                <span className="font-bold text-slate-900">{selectedMember.phone}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-slate-500 block mb-0.5">E-mail :</span>
                <span className="font-bold text-slate-900">{selectedMember.email}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-slate-500 block mb-0.5">Qualité :</span>
                <span className="font-bold text-slate-900">{selectedMember.membershipType}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-slate-500 block mb-0.5">Secteur Rattaché :</span>
                <span className="font-bold text-slate-900">{selectedMember.department || 'Général'}</span>
              </div>

              <div className="col-span-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-slate-500 block mb-0.5">Adresse :</span>
                <span className="font-bold text-slate-900">{selectedMember.address || 'Non communiquée'}</span>
              </div>

              {selectedMember.notes && (
                <div className="col-span-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-slate-500 block mb-0.5">Observations :</span>
                  <p className="text-slate-700 leading-relaxed">{selectedMember.notes}</p>
                </div>
              )}
            </div>

            {/* Photo / Document Upload Control */}
            {canEdit && (
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Mettre à jour la photo :</span>
                <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 font-semibold transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploading ? 'Chargement...' : 'Choisir une photo'}</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} disabled={uploading} className="hidden" />
                </label>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setViewModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800"
              >
                Fermer
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CREATE / EDIT FORM MODAL */}
      {formModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white max-w-lg w-full rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-serif font-bold text-slate-900">
                {isEditMode ? 'Modifier la Fiche Membre' : 'Nouveau Membre - Inscription'}
              </h3>
              <button onClick={() => setFormModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed font-semibold">{formError}</div>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nom Complet <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName || ''}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Ex: Rasoa Norosoa"
                  className="w-full py-2 px-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Numéro CIN <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.cin || ''}
                    onChange={(e) => setFormData({ ...formData, cin: e.target.value })}
                    placeholder="101 234 567 890"
                    className="w-full py-2 px-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Téléphone <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+261 34 00 000 00"
                    className="w-full py-2 px-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Adresse E-mail
                </label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="membre@amm.mg"
                  className="w-full py-2 px-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Type d'adhésion
                  </label>
                  <select
                    value={formData.membershipType || 'Producteur'}
                    onChange={(e) => setFormData({ ...formData, membershipType: e.target.value as Member['membershipType'] })}
                    className="w-full py-2 px-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="Producteur">Producteur</option>
                    <option value="Artisan">Artisan</option>
                    <option value="Éleveur">Éleveur</option>
                    <option value="Formateur">Formateur</option>
                    <option value="Adhérent Sympathisant">Adhérent Sympathisant</option>
                    <option value="Membre d'Honneur">Membre d'Honneur</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Secteur Rattaché
                  </label>
                  <select
                    value={formData.department || 'Agriculture & Agroécologie'}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full py-2 px-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="Agriculture & Agroécologie">Agriculture & Agroécologie</option>
                    <option value="Élevage & Santé Animale">Élevage & Santé Animale</option>
                    <option value="Arts & Artisanat Culturel">Arts & Artisanat Culturel</option>
                    <option value="Formation Professionnelle">Formation Professionnelle</option>
                    <option value="Développement Communautaire">Développement Communautaire</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Statut de l'Adhésion
                </label>
                <select
                  value={formData.status || 'ACTIVE'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Member['status'] })}
                  className="w-full py-2 px-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="ACTIVE">Actif (Approuvé)</option>
                  <option value="PENDING">En Attente de Validation</option>
                  <option value="SUSPENDED">Suspendu</option>
                  <option value="INACTIVE">Inactif</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Adresse physique / Localité
                </label>
                <input
                  type="text"
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Ex: Antsirabe, District Sud"
                  className="w-full py-2 px-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Observations / Remarques
                </label>
                <textarea
                  rows={2}
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Remarques éventuelles sur la candidature ou le profil..."
                  className="w-full py-2 px-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setFormModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 shadow-md flex items-center gap-1.5"
                >
                  {formSubmitting ? 'Enregistrement...' : isEditMode ? 'Enregistrer les modifications' : 'Créer le Membre'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
