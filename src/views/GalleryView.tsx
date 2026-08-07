import React, { useState } from 'react';
import { PageRoute, GalleryItem } from '../types';
import { GALLERY_DATA } from '../data/mockData';
import { Filter, Image as ImageIcon, ZoomIn } from 'lucide-react';

interface GalleryViewProps {
  onNavigate: (route: PageRoute) => void;
}

export const GalleryView: React.FC<GalleryViewProps> = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [activeImage, setActiveImage] = useState<GalleryItem | null>(null);

  const categories = ['Tous', 'Agriculture', 'Livestock', 'Arts', 'Training', 'Community'];

  const filteredItems = GALLERY_DATA.filter((item) => {
    if (selectedCategory === 'Tous') return true;
    return item.category === selectedCategory;
  });

  return (
    <div className="py-12 space-y-12">
      
      {/* Header */}
      <section className="bg-slate-900 text-white py-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <span className="inline-block px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950 rounded-full border border-emerald-800">
            Médiathèque Institutionnelle
          </span>
          <h1 className="text-3xl sm:text-5xl font-serif font-extrabold tracking-tight">
            Galerie Photos
          </h1>
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 font-normal">
            Illustrations et témoignages visuels des activités et projets menés sur le terrain par l'Association Malagasy Miray.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Category Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat === 'Tous' ? 'Toutes les catégories' : cat}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setActiveImage(item)}
              className="group relative bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-xs cursor-pointer hover:shadow-lg transition-all duration-300"
            >
              <div className="h-64 overflow-hidden relative">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="p-3 rounded-full bg-white/90 text-slate-900 shadow-lg">
                    <ZoomIn className="w-5 h-5" />
                  </div>
                </div>
                <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-900/80 text-white backdrop-blur-xs">
                  {item.category}
                </span>
              </div>

              <div className="p-4 space-y-1">
                <h3 className="font-serif font-bold text-sm text-slate-900 line-clamp-1">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-1">
                  {item.caption}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Lightbox Modal */}
      {activeImage && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white rounded-3xl max-w-3xl w-full p-6 space-y-4 shadow-2xl border border-slate-800 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-bold uppercase text-emerald-400">
                  {activeImage.category} • {activeImage.date}
                </span>
                <h3 className="font-serif font-bold text-lg text-white">
                  {activeImage.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveImage(null)}
                className="p-2 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden max-h-[60vh] bg-black">
              <img src={activeImage.imageUrl} alt={activeImage.title} className="w-full h-full object-contain mx-auto" />
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {activeImage.caption}
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
