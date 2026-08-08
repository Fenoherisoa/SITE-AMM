import React from 'react';
import { 
  Users, 
  Calendar, 
  Briefcase, 
  DollarSign, 
  Settings, 
  Truck, 
  Calculator, 
  ShieldAlert 
} from 'lucide-react';
import { UserMetadata } from '../types';

interface DashboardMenuProps {
  user: UserMetadata;
  onSelectModule: (moduleKey: string) => void;
}

export const DashboardMenu: React.FC<DashboardMenuProps> = ({ user, onSelectModule }) => {
  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

  const menuItems = [
    {
      key: 'members',
      title: 'Gestion des Membres',
      description: 'Suivi et administration de la liste complète des membres.',
      icon: <Users className="w-12 h-12 text-emerald-500" />,
      show: true
    },
    {
      key: 'leaves',
      title: 'Gestion des Congés',
      description: 'Validation et suivi des demandes de congés et absences.',
      icon: <Calendar className="w-12 h-12 text-blue-500" />,
      show: true
    },
    {
      key: 'hr',
      title: 'Ressources Humaines (RH)',
      description: 'Gestion du personnel, des dossiers administratifs et des relations.',
      icon: <Briefcase className="w-12 h-12 text-purple-500" />,
      show: isAdmin || user.permissions?.includes('hr.manage')
    },
    {
      key: 'payroll',
      title: 'Gestion de Paie & Salaire',
      description: 'Calcul et distribution des salaires et des avantages sociaux.',
      icon: <DollarSign className="w-12 h-12 text-amber-500" />,
      show: isAdmin || user.permissions?.includes('payroll.manage')
    },
    {
      key: 'logistics',
      title: 'Gestion de la Logistique',
      description: 'Suivi des stocks, des équipements et des approvisionnements.',
      icon: <Truck className="w-12 h-12 text-cyan-500" />,
      show: true
    },
    {
      key: 'accounting',
      title: 'Comptabilisation',
      description: 'Enregistrement des flux financiers, dépenses et recettes.',
      icon: <Calculator className="w-12 h-12 text-rose-500" />,
      show: isAdmin || user.permissions?.includes('accounting.manage')
    },
    {
      key: 'operations',
      title: 'Gestion des Opérations',
      description: 'Suivi des projets, des activités et des tâches quotidiennes.',
      icon: <ShieldAlert className="w-12 h-12 text-indigo-500" />,
      show: true
    },
    {
      key: 'account',
      title: 'Mon Compte',
      description: 'Mise à jour de vos informations personnelles et de votre mot de passe.',
      icon: <Settings className="w-12 h-12 text-gray-400" />,
      show: true
    },
    {
      key: 'settings',
      title: 'Paramètres du Site',
      description: 'Configuration générale, préférences système et paramètres globaux.',
      icon: <Settings className="w-12 h-12 text-red-500" />,
      show: isAdmin
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Bienvenue, {user.displayName}
        </h1>
        <p className="text-sm text-gray-600">
          Veuillez sélectionner le module que vous souhaitez gérer ci-dessous :
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems
          .filter(item => item.show)
          .map(item => (
            <button
              key={item.key}
              onClick={() => onSelectModule(item.key)}
              className="flex flex-col items-start p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-emerald-500 transition-all text-left group"
            >
              <div className="p-4 bg-gray-50 rounded-xl group-hover:bg-emerald-50 transition-colors mb-4">
                {item.icon}
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors">
                {item.title}
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                {item.description}
              </p>
            </button>
          ))}
      </div>
    </div>
  );
};