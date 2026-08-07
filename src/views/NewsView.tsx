import React, { useState } from 'react';
import { PageRoute, NewsArticle } from '../types';
import { NEWS_DATA } from '../data/mockData';
import { Calendar, User, Clock, ArrowRight, BookOpen } from 'lucide-react';

interface NewsViewProps {
  onNavigate: (route: PageRoute) => void;
}

export const NewsView: React.FC<NewsViewProps> = () => {
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

  return (
    <div className="py-12 space-y-12">
      
      {/* Header */}
      <section className="bg-slate-900 text-white py-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <span className="inline-block px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950 rounded-full border border-emerald-800">
            Espace Presse & Publications
          </span>
          <h1 className="text-3xl sm:text-5xl font-serif font-extrabold tracking-tight">
            Actualités & Communiqués
          </h1>
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 font-normal">
            Suivez les activités, projets et annonces officielles de l'Association Malagasy Miray.
          </p>
        </div>
      </section>

      {/* Main Articles Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Featured Article */}
        {NEWS_DATA.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-6 lg:p-8">
            <div className="lg:col-span-7 h-72 lg:h-96 rounded-2xl overflow-hidden relative">
              <img
                src={NEWS_DATA[0].image}
                alt={NEWS_DATA[0].title}
                className="w-full h-full object-cover"
              />
              <span className="absolute top-4 left-4 px-3 py-1 bg-slate-950/80 text-emerald-400 text-xs font-bold uppercase rounded-lg border border-slate-700">
                À la une
              </span>
            </div>

            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md">
                  {NEWS_DATA[0].category}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {NEWS_DATA[0].date}
                </span>
              </div>

              <h2 className="font-serif font-bold text-2xl sm:text-3xl text-slate-900 leading-tight">
                {NEWS_DATA[0].title}
              </h2>

              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                {NEWS_DATA[0].excerpt}
              </p>

              <div className="pt-2">
                <button
                  onClick={() => setSelectedArticle(NEWS_DATA[0])}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition-colors"
                >
                  <span>Lire l'article complet</span>
                  <ArrowRight className="w-4 h-4 text-emerald-400" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Secondary Articles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {NEWS_DATA.slice(1).map((art) => (
            <div key={art.id} className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col justify-between">
              <div>
                <div className="h-48 overflow-hidden">
                  <img src={art.image} alt={art.title} className="w-full h-full object-cover" />
                </div>
                <div className="p-6 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                      {art.category}
                    </span>
                    <span>{art.date}</span>
                  </div>

                  <h3 className="font-serif font-bold text-lg text-slate-900 line-clamp-2">
                    {art.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {art.excerpt}
                  </p>
                </div>
              </div>

              <div className="p-6 pt-0">
                <button
                  onClick={() => setSelectedArticle(art)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  <span>Lire la suite</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Article Detail Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-10 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                  {selectedArticle.category}
                </span>
                <h2 className="font-serif font-bold text-2xl sm:text-3xl text-slate-900 mt-2">
                  {selectedArticle.title}
                </h2>
                <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {selectedArticle.date}</span>
                  <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {selectedArticle.author}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {selectedArticle.readTime}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedArticle(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg text-lg"
              >
                ✕
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden border border-slate-200">
              <img src={selectedArticle.image} alt={selectedArticle.title} className="w-full h-72 object-cover" />
            </div>

            <div className="prose prose-slate text-sm leading-relaxed text-slate-700 whitespace-pre-line font-normal">
              {selectedArticle.content}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedArticle(null)}
                className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-sm"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
