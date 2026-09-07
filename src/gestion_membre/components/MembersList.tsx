import React, { useState, useMemo } from 'react';
import { 
  Eye, Edit2, Printer, Trash2, Search, Filter, Plus, 
  Download, RefreshCw, Users, CheckCircle2, AlertCircle, 
  MapPin, Phone, Mail, ArrowUpDown, ChevronLeft, ChevronRight, X
} from 'lucide-react';
import { Member, Enquete } from '../types';
import { PROJECT_PREFIX } from '../constants';
import { madagascarData } from '../madagascarData';

interface Props {
  allMembers: Member[];
  allEnquetes: Enquete[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setSelectedMember: (member: Member | null) => void;
  setModalMemberDetail: (open: boolean) => void;
  startEditMember: (member: Member) => void;
  loadAndGenerateAttestation: (member: Member, type: string) => void;
  exportMembresPDF: (membersList: Member[]) => void;
  onNavigateToAdhesion?: () => void;
  onDeleteMember?: (member: Member) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export default function MembersList({
  allMembers,
  allEnquetes,
  searchQuery,
  setSearchQuery,
  setSelectedMember,
  setModalMemberDetail,
  startEditMember,
  loadAndGenerateAttestation,
  exportMembresPDF,
  onNavigateToAdhesion,
  onDeleteMember,
  onRefresh,
  isRefreshing
}: Props) {
  // Filters state
  const [filterProject, setFilterProject] = useState<string>('ALL');
  const [filterProvince, setFilterProvince] = useState<string>('ALL');
  const [filterEnquete, setFilterEnquete] = useState<string>('ALL');
  const [filterGenre, setFilterGenre] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'name_asc' | 'name_desc' | 'matricule'>('date_desc');
  const [showFiltersPanel, setShowFiltersPanel] = useState<boolean>(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filterProject !== 'ALL') count++;
    if (filterProvince !== 'ALL') count++;
    if (filterEnquete !== 'ALL') count++;
    if (filterGenre !== 'ALL') count++;
    return count;
  }, [filterProject, filterProvince, filterEnquete, filterGenre]);

  const resetFilters = () => {
    setSearchQuery('');
    setFilterProject('ALL');
    setFilterProvince('ALL');
    setFilterEnquete('ALL');
    setFilterGenre('ALL');
    setSortBy('date_desc');
    setCurrentPage(1);
  };

  // Real statistics summary (calculated from real data)
  const stats = useMemo(() => {
    const total = allMembers.length;
    const femaleCount = allMembers.filter(m => m.genre === 'VAVY').length;
    const maleCount = allMembers.filter(m => m.genre === 'LAHY').length;
    
    // Member matricules that have a completed enquête
    const surveyedMatricules = new Set(allEnquetes.map(e => e.matricule_olona).filter(Boolean));
    const withEnquete = allMembers.filter(m => surveyedMatricules.has(m.matricule)).length;
    const withoutEnquete = total - withEnquete;

    // Unique projects
    const uniqueProjects = new Set(allMembers.map(m => m.tetikasa).filter(Boolean)).size;

    return {
      total,
      femaleCount,
      maleCount,
      femalePct: total > 0 ? Math.round((femaleCount / total) * 100) : 0,
      malePct: total > 0 ? Math.round((maleCount / total) * 100) : 0,
      withEnquete,
      withoutEnquete,
      uniqueProjects
    };
  }, [allMembers, allEnquetes]);

  // Set of surveyed matricules for fast lookup
  const surveyedMap = useMemo(() => {
    const map = new Map<string, Enquete>();
    allEnquetes.forEach(e => {
      if (e.matricule_olona) {
        map.set(e.matricule_olona, e);
      }
    });
    return map;
  }, [allEnquetes]);

  // Filtered & Sorted Members
  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return allMembers
      .filter(m => {
        // Query search on all textual fields
        const matchesQuery = !q || (
          (m.anarana && m.anarana.toLowerCase().includes(q)) ||
          (m.matricule && m.matricule.toLowerCase().includes(q)) ||
          (m.cin && m.cin.toLowerCase().includes(q)) ||
          (m.telephone && m.telephone.toLowerCase().includes(q)) ||
          (m.email_notification && m.email_notification.toLowerCase().includes(q)) ||
          (m.commune && m.commune.toLowerCase().includes(q)) ||
          (m.fokontany && m.fokontany.toLowerCase().includes(q)) ||
          (m.region && m.region.toLowerCase().includes(q)) ||
          (m.province && m.province.toLowerCase().includes(q))
        );

        // Project filter
        const matchesProject = filterProject === 'ALL' || m.tetikasa === filterProject;

        // Province filter
        const matchesProvince = filterProvince === 'ALL' || m.province === filterProvince;

        // Genre filter
        const matchesGenre = filterGenre === 'ALL' || m.genre === filterGenre;

        // Enquête filter
        const hasEnquete = surveyedMap.has(m.matricule);
        const matchesEnquete = 
          filterEnquete === 'ALL' ||
          (filterEnquete === 'WITH' && hasEnquete) ||
          (filterEnquete === 'WITHOUT' && !hasEnquete);

        return matchesQuery && matchesProject && matchesProvince && matchesGenre && matchesEnquete;
      })
      .sort((a, b) => {
        if (sortBy === 'date_desc') {
          return (b.date_adhesion || '').localeCompare(a.date_adhesion || '');
        }
        if (sortBy === 'date_asc') {
          return (a.date_adhesion || '').localeCompare(b.date_adhesion || '');
        }
        if (sortBy === 'name_asc') {
          return (a.anarana || '').localeCompare(b.anarana || '');
        }
        if (sortBy === 'name_desc') {
          return (b.anarana || '').localeCompare(a.anarana || '');
        }
        if (sortBy === 'matricule') {
          return (a.matricule || '').localeCompare(b.matricule || '');
        }
        return 0;
      });
  }, [allMembers, searchQuery, filterProject, filterProvince, filterGenre, filterEnquete, sortBy, surveyedMap]);

  // Paginated records
  const totalRecords = filteredMembers.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const paginatedMembers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredMembers.slice(startIndex, startIndex + pageSize);
  }, [filteredMembers, currentPage, pageSize]);

  // Adjust current page if out of range
  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // Export CSV functionality
  const handleExportCSV = () => {
    if (filteredMembers.length === 0) {
      alert("Aucun adhérent à exporter.");
      return;
    }

    const headers = [
      "Matricule",
      "Nom Complet",
      "Genre",
      "CIN",
      "Date Délivrance CIN",
      "Téléphone",
      "Email",
      "Projet",
      "Province",
      "Région",
      "District",
      "Commune",
      "Fokontany",
      "Date Adhésion",
      "Enquête Réalisée"
    ];

    const rows = filteredMembers.map(m => [
      `"${m.matricule || ''}"`,
      `"${(m.anarana || '').replace(/"/g, '""')}"`,
      `"${m.genre || ''}"`,
      `"${m.cin || ''}"`,
      `"${m.date_delivrance || ''}"`,
      `"${m.telephone || ''}"`,
      `"${m.email_notification || ''}"`,
      `"${(m.tetikasa || '').replace(/"/g, '""')}"`,
      `"${m.province || ''}"`,
      `"${m.region || ''}"`,
      `"${m.district || ''}"`,
      `"${m.commune || ''}"`,
      `"${m.fokontany || ''}"`,
      `"${m.date_adhesion || ''}"`,
      `"${surveyedMap.has(m.matricule) ? 'OUI' : 'NON'}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `AMM_Membres_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Distinct Project list
  const availableProjects = useMemo(() => {
    const list = new Set(Object.keys(PROJECT_PREFIX));
    allMembers.forEach(m => {
      if (m.tetikasa) list.add(m.tetikasa);
    });
    return Array.from(list);
  }, [allMembers]);

  // Distinct Province list
  const availableProvinces = useMemo(() => {
    return Object.keys(madagascarData);
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto font-sans">
      
      {/* 1. TOP STATS BAR (Real dynamic metrics) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Adhérents</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{stats.total}</span>
            <span className="text-xs text-slate-500 font-medium">enregistrés</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Genre (Lahy / Vavy)</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
              ⚤
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between text-xs font-semibold">
            <span className="text-slate-800">Hommes: <strong className="text-slate-900">{stats.maleCount}</strong> ({stats.malePct}%)</span>
            <span className="text-slate-800">Femmes: <strong className="text-slate-900">{stats.femaleCount}</strong> ({stats.femalePct}%)</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Statut Enquêtes</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-3 text-xs font-semibold">
            <span className="text-emerald-700">✓ {stats.withEnquete} Enquêtés</span>
            <span className="text-amber-700">⏳ {stats.withoutEnquete} En attente</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Projets Actifs</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
              ⚡
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{stats.uniqueProjects}</span>
            <span className="text-xs text-slate-500 font-medium">programmes</span>
          </div>
        </div>
      </div>

      {/* 2. MAIN HEADER & ACTIONS */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Gestion des Membres & Adhérents
              </h1>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {totalRecords} membre{totalRecords > 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Registre officiel et répertoire administratif des membres du Mouvement AMM.
            </p>
          </div>

          {/* Top Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                title="Actualiser la liste depuis la base de données"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
              </button>
            )}

            <button
              onClick={() => exportMembresPDF(filteredMembers)}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Imprimer Liste</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Exporter CSV</span>
            </button>

            {onNavigateToAdhesion && (
              <button
                onClick={onNavigateToAdhesion}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nouvel Adhérent</span>
              </button>
            )}
          </div>
        </div>

        {/* 3. SEARCH BAR & FILTER TOGGLES */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Rechercher par nom, matricule, CIN, téléphone, commune..."
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filter Toggle Button */}
          <button
            onClick={() => setShowFiltersPanel(!showFiltersPanel)}
            className={`px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              showFiltersPanel || activeFiltersCount > 0
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filtres</span>
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Sorting Dropdown */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-semibold text-slate-500">Trier par:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer pr-1"
            >
              <option value="date_desc">Adhésion (Plus récents)</option>
              <option value="date_asc">Adhésion (Plus anciens)</option>
              <option value="name_asc">Nom (A → Z)</option>
              <option value="name_desc">Nom (Z → A)</option>
              <option value="matricule">Matricule AMM</option>
            </select>
          </div>
        </div>

        {/* 4. EXPANDABLE FILTERS DRAWER */}
        {showFiltersPanel && (
          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3 animate-fade-in text-xs">
            <div className="flex items-center justify-between font-bold text-slate-700 pb-1 border-b border-slate-200/80">
              <span>Critères de filtrage avancés</span>
              {activeFiltersCount > 0 && (
                <button
                  onClick={resetFilters}
                  className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                >
                  Réinitialiser tous les filtres
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              {/* Project Filter */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Projet / Tetikasa
                </label>
                <select
                  value={filterProject}
                  onChange={e => { setFilterProject(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="ALL">Tous les projets ({availableProjects.length})</option>
                  {availableProjects.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* Province Filter */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Province / Faritany
                </label>
                <select
                  value={filterProvince}
                  onChange={e => { setFilterProvince(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="ALL">Toutes les provinces (6)</option>
                  {availableProvinces.map(prov => (
                    <option key={prov} value={prov}>{prov}</option>
                  ))}
                </select>
              </div>

              {/* Enquête Filter */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Situation Enquête
                </label>
                <select
                  value={filterEnquete}
                  onChange={e => { setFilterEnquete(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="ALL">Tous les statuts</option>
                  <option value="WITH">Dossier Enquête Enregistré ({stats.withEnquete})</option>
                  <option value="WITHOUT">Sans Enquête / Éligible ({stats.withoutEnquete})</option>
                </select>
              </div>

              {/* Genre Filter */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Genre
                </label>
                <select
                  value={filterGenre}
                  onChange={e => { setFilterGenre(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="ALL">Tous les genres</option>
                  <option value="LAHY">Hommes (Lahy - {stats.maleCount})</option>
                  <option value="VAVY">Femmes (Vavy - {stats.femaleCount})</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* 5. MEMBERS DATA TABLE (Desktop & Tablet) */}
        <div className="hidden md:block overflow-hidden border border-slate-200 rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-[11px] uppercase tracking-wider font-bold select-none">
                <th className="py-3 px-4 w-[16%]">Matricule & ID</th>
                <th className="py-3 px-4 w-[28%]">Adhérent & Contact</th>
                <th className="py-3 px-4 w-[18%]">Projet de Rattachement</th>
                <th className="py-3 px-4 w-[18%]">Localisation</th>
                <th className="py-3 px-4 w-[10%] text-center">Enquête</th>
                <th className="py-3 px-4 w-[10%] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedMembers.map((m, idx) => {
                const hasEnquete = surveyedMap.has(m.matricule);
                const initials = m.anarana
                  ? m.anarana.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
                  : 'M';

                return (
                  <tr 
                    key={m.id || m.matricule}
                    className={`hover:bg-indigo-50/40 transition-colors group ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                    }`}
                  >
                    {/* Matricule & ID */}
                    <td className="py-3 px-4 align-middle">
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 group-hover:bg-indigo-100 group-hover:text-indigo-900 px-2 py-1 rounded border border-slate-200 text-[11px] block w-fit">
                        {m.matricule || m.id}
                      </span>
                      {m.date_adhesion && (
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          Inscrit: {m.date_adhesion}
                        </span>
                      )}
                    </td>

                    {/* Nom & Contact */}
                    <td className="py-3 px-4 align-middle">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {m.photo ? (
                            <img src={m.photo} alt="" className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <span>{initials}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <button
                            onClick={() => { setSelectedMember(m); setModalMemberDetail(true); }}
                            className="font-bold text-slate-900 hover:text-indigo-600 truncate block text-left cursor-pointer transition-colors"
                          >
                            {m.anarana}
                          </button>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                            {m.telephone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-slate-400" />
                                {m.telephone}
                              </span>
                            )}
                            {m.cin && (
                              <span className="font-mono text-[10px] text-slate-400">
                                CIN: {m.cin}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Projet */}
                    <td className="py-3 px-4 align-middle">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wide bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {m.tetikasa || 'AMM'}
                      </span>
                    </td>

                    {/* Localisation */}
                    <td className="py-3 px-4 align-middle">
                      <div className="text-slate-800 font-medium truncate">
                        {m.commune || m.fokontany ? `${m.commune || ''} ${m.fokontany ? `(${m.fokontany})` : ''}` : '---'}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {[m.region, m.province].filter(Boolean).join(' • ') || 'Localisation non définie'}
                      </div>
                    </td>

                    {/* Enquête Statut */}
                    <td className="py-3 px-4 align-middle text-center">
                      {hasEnquete ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Enquêté</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                          <span>Éligible</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 align-middle text-right select-none">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setSelectedMember(m); setModalMemberDetail(true); }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                          title="Consulter la fiche détaillée"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => startEditMember(m)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                          title="Modifier les données du membre"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => loadAndGenerateAttestation(m, 'Adhesion')}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                          title="Générer l'attestation officielle"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {onDeleteMember && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Confirmer la suppression du membre ${m.anarana} (${m.matricule}) ?`)) {
                                onDeleteMember(m);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Supprimer définitivement"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 6. MOBILE CARDS VIEW (md:hidden) */}
        <div className="md:hidden space-y-3">
          {paginatedMembers.map(m => {
            const hasEnquete = surveyedMap.has(m.matricule);
            const initials = m.anarana
              ? m.anarana.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
              : 'M';

            return (
              <div 
                key={m.id || m.matricule}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                      {initials}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{m.anarana}</h4>
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-indigo-600 font-bold">
                        <span>{m.matricule || m.id}</span>
                        <span>•</span>
                        <span className="font-sans text-slate-500 font-semibold">{m.tetikasa}</span>
                      </div>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    hasEnquete ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {hasEnquete ? 'Enquêté' : 'Éligible'}
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-lg">
                  {m.telephone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{m.telephone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{[m.commune, m.region, m.province].filter(Boolean).join(', ') || 'Localisation non renseignée'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400">
                    {m.date_adhesion ? `Adhésion: ${m.date_adhesion}` : ''}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setSelectedMember(m); setModalMemberDetail(true); }}
                      className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => startEditMember(m)}
                      className="p-2 rounded-lg text-amber-600 hover:bg-amber-50"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => loadAndGenerateAttestation(m, 'Adhesion')}
                      className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    {onDeleteMember && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Confirmer la suppression du membre ${m.anarana} ?`)) {
                            onDeleteMember(m);
                          }
                        }}
                        className="p-2 rounded-lg text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 7. EMPTY STATES */}
        {filteredMembers.length === 0 && (
          <div className="text-center py-12 px-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              {allMembers.length === 0 ? "Aucun membre enregistré" : "Aucun membre ne correspond à vos critères"}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {allMembers.length === 0
                ? "La base de données ne contient aucun adhérent pour le moment. Cliquez sur 'Nouvel Adhérent' pour enregistrer la première adhésion."
                : "Vérifiez vos termes de recherche ou réinitialisez les filtres pour afficher l'ensemble des adhérents."}
            </p>
            {activeFiltersCount > 0 && (
              <button
                onClick={resetFilters}
                className="mt-2 px-4 py-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs font-semibold cursor-pointer"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        )}

        {/* 8. PAGINATION FOOTER */}
        {totalRecords > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span>Affichage de</span>
              <strong className="text-slate-800 font-bold">
                {Math.min((currentPage - 1) * pageSize + 1, totalRecords)}
              </strong>
              <span>à</span>
              <strong className="text-slate-800 font-bold">
                {Math.min(currentPage * pageSize, totalRecords)}
              </strong>
              <span>sur</span>
              <strong className="text-slate-800 font-bold">{totalRecords}</strong>
              <span>adhérents</span>
              
              <span className="hidden sm:inline mx-2 text-slate-300">|</span>
              
              <label className="hidden sm:inline">Lignes par page:</label>
              <select
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="hidden sm:inline bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-slate-700 outline-none cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1 select-none">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none cursor-pointer text-slate-700"
                aria-label="Page précédente"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 py-1 font-semibold text-slate-700">
                Page {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none cursor-pointer text-slate-700"
                aria-label="Page suivante"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
