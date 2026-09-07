import React, { useState, useEffect } from 'react';
import { 
  X, Printer, Edit2, Trash2, User, Phone, Mail, MapPin, 
  Calendar, FileText, CheckCircle2, AlertCircle, Shield, CreditCard, Building
} from 'lucide-react';
import { Member, Enquete } from '../types';
import { BASE_URL, requestRtdb } from '../services/firebaseService';

interface Props {
  member: Member | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (member: Member) => void;
  onPrintAttestation: (member: Member, type: string) => void;
  onDelete?: (member: Member) => void;
  linkedEnquete?: Enquete | null;
}

export default function MemberDetailModal({
  member,
  isOpen,
  onClose,
  onEdit,
  onPrintAttestation,
  onDelete,
  linkedEnquete
}: Props) {
  const [account, setAccount] = useState<{ solde: number; solde_credit: number; solde_debit: number } | null>(null);
  const [loadingAccount, setLoadingAccount] = useState(false);

  useEffect(() => {
    if (isOpen && member?.matricule) {
      setLoadingAccount(true);
      requestRtdb(`/comptes/${member.matricule}.json`)
        .then(res => res.json())
        .then(val => {
          setAccount(val || { solde: 0, solde_credit: 0, solde_debit: 0 });
        })
        .catch(() => {
          setAccount({ solde: 0, solde_credit: 0, solde_debit: 0 });
        })
        .finally(() => {
          setLoadingAccount(false);
        });
    } else {
      setAccount(null);
    }
  }, [isOpen, member?.matricule]);

  if (!isOpen || !member) return null;

  // Format initials
  const initials = member.anarana
    ? member.anarana.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
    : 'M';

  const formatAriary = (amount?: number) => {
    return (amount || 0).toLocaleString('fr-FR') + ' Ar';
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs font-sans animate-fade-in">
      <div 
        className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh] transition-all"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-slate-900 px-6 py-5 flex items-center justify-between text-white select-none shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-inner">
              {member.photo ? (
                <img src={member.photo} alt={member.anarana} className="w-full h-full object-cover rounded-xl" />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {member.matricule || member.id}
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                  {member.tetikasa || 'AMM'}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white mt-1 line-clamp-1">
                {member.anarana}
              </h2>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          
          {/* Quick status bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Date d'Adhésion</span>
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                <span>{member.date_adhesion || 'Non renseignée'}</span>
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Statut Enquête</span>
              <div className="text-xs font-bold flex items-center gap-1.5">
                {linkedEnquete ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span className="text-emerald-700 truncate">{linkedEnquete.status || 'Enquêté'}</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    <span className="text-amber-700">En attente</span>
                  </>
                )}
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Genre</span>
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                <span>{member.genre || 'Non spécifié'}</span>
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Solde Compte</span>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>{loadingAccount ? '...' : formatAriary(account?.solde)}</span>
              </div>
            </div>
          </div>

          {/* Section 1: Informations Personnelles & Contacts */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <User className="h-4 w-4 text-indigo-600" />
              <span>Identité & Coordonnées</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block mb-0.5">Nom complet et prénoms</span>
                <span className="font-bold text-slate-900 text-sm">{member.anarana || '---'}</span>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block mb-0.5">Numéro de téléphone</span>
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  <span>{member.telephone || 'Non renseigné'}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block mb-0.5">Date et lieu de naissance</span>
                <span className="font-medium text-slate-800">
                  {member.date_naissance ? `${member.date_naissance}` : '---'}
                  {member.lieu_naissance ? ` à ${member.lieu_naissance}` : ''}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block mb-0.5">Email de notification</span>
                <div className="font-medium text-slate-800 flex items-center gap-1.5 truncate">
                  <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{member.email_notification || 'Non renseigné'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Carte Nationale d'Identité */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <FileText className="h-4 w-4 text-indigo-600" />
              <span>Pièce d'Identité (CIN)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block mb-0.5">Numéro CIN</span>
                <span className="font-mono font-bold text-slate-900 text-sm">{member.cin || 'Non renseigné'}</span>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block mb-0.5">Délivrance</span>
                <span className="font-medium text-slate-800">
                  {member.date_delivrance ? `Le ${member.date_delivrance}` : ''}
                  {member.lieu_delivrance ? ` à ${member.lieu_delivrance}` : '---'}
                </span>
              </div>

              {member.date_duplicata && (
                <div>
                  <span className="text-slate-400 font-semibold block mb-0.5">Duplicata CIN</span>
                  <span className="font-medium text-slate-800">
                    Délivré le {member.date_duplicata} {member.lieu_duplicata ? `à ${member.lieu_duplicata}` : ''}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Localisation Géographique */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <MapPin className="h-4 w-4 text-indigo-600" />
              <span>Affectation & Localisation Géographique</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Province</span>
                <span className="font-bold text-slate-800 truncate block">{member.province || '---'}</span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Région</span>
                <span className="font-bold text-slate-800 truncate block">{member.region || '---'}</span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">District</span>
                <span className="font-bold text-slate-800 truncate block">{member.district || '---'}</span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Commune</span>
                <span className="font-bold text-slate-800 truncate block">{member.commune || '---'}</span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 col-span-2 sm:col-span-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Fokontany</span>
                <span className="font-bold text-slate-800 truncate block">{member.fokontany || '---'}</span>
              </div>
            </div>
          </div>

          {/* Section 4: Enquête Sociale si existante */}
          {linkedEnquete && (
            <div className="bg-emerald-50/70 p-5 rounded-xl border border-emerald-200/80 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Dossier Enquête Sociale Associée</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-emerald-950">
                <div>
                  <span className="text-emerald-700 block text-[11px]">Enquêteur</span>
                  <span className="font-bold">{linkedEnquete.enqueteur || '---'}</span>
                </div>
                <div>
                  <span className="text-emerald-700 block text-[11px]">Date de soumission</span>
                  <span className="font-bold">
                    {linkedEnquete.submitted_at ? new Date(linkedEnquete.submitted_at).toLocaleDateString('fr-FR') : '---'}
                  </span>
                </div>
                <div>
                  <span className="text-emerald-700 block text-[11px]">Statut Dossier</span>
                  <span className="font-bold uppercase">{linkedEnquete.status || 'Enregistré'}</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="bg-white px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 select-none shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onDelete && (
              <button
                onClick={() => {
                  if (window.confirm(`Confirmer la suppression définitive du membre ${member.anarana} (${member.matricule}) ?`)) {
                    onDelete(member);
                    onClose();
                  }
                }}
                className="px-3.5 py-2.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer w-full sm:w-auto"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Supprimer</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => {
                onPrintAttestation(member, 'Adhesion');
              }}
              className="px-4 py-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs w-full sm:w-auto"
            >
              <Printer className="h-3.5 w-3.5 text-indigo-600" />
              <span>Imprimer Attestation</span>
            </button>

            <button
              onClick={() => {
                onEdit(member);
                onClose();
              }}
              className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs w-full sm:w-auto"
            >
              <Edit2 className="h-3.5 w-3.5" />
              <span>Modifier la Fiche</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
