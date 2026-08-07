import React, { useState } from 'react';
import { PageRoute, ContactFormData } from '../types';
import { SectionTitle } from '../components/SectionTitle';
import { ORGANIZATION_INFO } from '../data/mockData';
import { Mail, Phone, MapPin, Send, CheckCircle2, AlertCircle } from 'lucide-react';

interface ContactViewProps {
  onNavigate: (route: PageRoute) => void;
}

export const ContactView: React.FC<ContactViewProps> = () => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 800);
  };

  return (
    <div className="py-12 space-y-12">
      
      {/* Header */}
      <section className="bg-slate-900 text-white py-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <span className="inline-block px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950 rounded-full border border-emerald-800">
            Écoute & Information
          </span>
          <h1 className="text-3xl sm:text-5xl font-serif font-extrabold tracking-tight">
            Contactez l'Association
          </h1>
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 font-normal">
            Vous êtes un usager, membre, partenaire ou institution ? Laissez-nous votre message.
          </p>
        </div>
      </section>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Form */}
          <div className="lg:col-span-7 bg-white p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
            <div>
              <h2 className="text-2xl font-serif font-bold text-slate-900">
                Formulaire de Contact
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Remplissez les informations ci-dessous. Notre secrétariat vous répondra dans les meilleurs délais.
              </p>
            </div>

            {submitted ? (
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-3 animate-in fade-in">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                <h3 className="font-bold font-serif text-lg">Message envoyé avec succès</h3>
                <p className="text-xs leading-relaxed">
                  Merci de nous avoir contactés. Votre demande a bien été enregistrée par le secrétariat de l'Association Malagasy Miray.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-semibold"
                >
                  Envoyer un autre message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Votre nom"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Adresse e-mail *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="exemple@email.mg"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+261 34 00 000 00"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Sujet *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="Objet de votre demande"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Message *
                  </label>
                  <textarea
                    rows={5}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Écrivez votre message ici..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-6 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span>Envoi en cours...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-emerald-400" />
                      <span>Envoyer le Message</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Institutional Contact Info Box */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900 text-white p-8 rounded-3xl space-y-6 border border-slate-800 shadow-md">
              <h3 className="text-xl font-serif font-bold text-white">
                Informations de Contact
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                Les coordonnées ci-dessous sont réservées à l'information générale et aux échanges institutionnels.
              </p>

              <div className="space-y-4 pt-2 text-sm text-slate-300">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-semibold text-white text-xs">Siège Institutionnel</span>
                    <span>{ORGANIZATION_INFO.addressPlaceholder}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-semibold text-white text-xs">Courrier Électronique</span>
                    <span>{ORGANIZATION_INFO.emailPlaceholder}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-semibold text-white text-xs">Téléphone</span>
                    <span>{ORGANIZATION_INFO.phonePlaceholder}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Pour des raisons de sécurité, aucun compte membre ne peut être créé via ce formulaire.</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
