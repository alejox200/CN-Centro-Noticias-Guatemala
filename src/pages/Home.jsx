import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import Navbar from '../components/Navbar';
import BannerImage from '../../Banner CN1.jpeg';
import NewsCard, { getEmbedUrl } from '../components/NewsCard';
import WaveText from '../components/WaveText';

function Home() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [filterCategory, setFilterCategory] = useState(null);

  useEffect(() => {
    async function fetchNews() {
      const { data, error } = await supabase
        .from('noticias')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setNews(data);
      }
      setLoading(false);
    }
    fetchNews();
  }, []);

  const closeModal = () => setSelectedArticle(null);

  const filteredNews = filterCategory ? news.filter(n => n.category === filterCategory) : news;

  return (
    <>
      <Navbar />
      
      <div style={{ width: '100%', position: 'relative' }}>
        <img src={BannerImage} alt="Banner" style={{ width: '100%', height: '350px', objectFit: 'cover', display: 'block' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(to top, rgba(0,0,0,0.1), transparent)' }}></div>
      </div>
      
      <div className="container" style={{ paddingBottom: '4rem' }}>
        <h2 style={{ marginTop: '2.5rem', fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-green)' }}>Últimas Noticias</h2>
        
        <div style={{ display: 'flex', gap: '1.5rem', overflowX: 'auto', padding: '1rem 0', marginBottom: '1rem', scrollbarWidth: 'thin' }}>
            {['INICIO', 'Nacionales', 'Internacionales', 'Deportes', 'Tecnología', 'Cultura', 'Entretenimiento'].map(cat => {
                const isActive = filterCategory === cat || (cat === 'INICIO' && filterCategory === null);
                return (
                    <button
                        key={cat}
                        onClick={() => setFilterCategory(cat === 'INICIO' ? null : cat)}
                        style={{
                            background: 'none',
                            border: isActive ? '1px solid var(--primary-green)' : '1px solid transparent',
                            borderRadius: '0.25rem',
                            padding: '0.5rem 1rem',
                            cursor: 'pointer',
                            fontStyle: 'italic',
                            fontWeight: '600',
                            color: isActive ? 'var(--secondary-orange)' : 'var(--text-main)',
                            transition: 'all 0.3s',
                            whiteSpace: 'nowrap',
                            outline: 'none'
                        }}
                    >
                        <WaveText text={cat.toUpperCase()} />
                    </button>
                );
            })}
        </div>
        
        {loading ? (
          <p style={{ textAlign: 'center', marginTop: '2rem' }}>Cargando noticias...</p>
        ) : filteredNews.length === 0 ? (
          <p style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-muted)' }}>
             {filterCategory ? `Aún no hay noticias para la categoría "${filterCategory}".` : 'Aún no hay noticias publicadas.'}
          </p>
        ) : (
          <div className="grid-news">
            {filteredNews.map(item => (
              <NewsCard key={item.id} article={item} onClick={setSelectedArticle} />
            ))}
          </div>
        )}
      </div>

       {/* MODAL DE NOTICIA EXPANDIDA */}
       {selectedArticle && (
         <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={closeModal}>
           <div style={{ backgroundColor: 'white', borderRadius: '1rem', width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', position: 'relative' }} onClick={e => e.stopPropagation()}>
             
             {/* BOTON CERRAR */}
             <button onClick={closeModal} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'white', color: 'black', border: 'none', borderRadius: '50%', width: '35px', height: '35px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.2rem', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.3)' }}>X</button>

             {/* ZONA CONTENIDO BLANCA */}
             <div style={{ padding: '2.5rem' }}>
                <span style={{ backgroundColor: 'var(--primary-green)', color: 'white', padding: '0.3rem 0.8rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase' }}>{selectedArticle.category}</span>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '1rem 0' }}>{selectedArticle.title}</h2>
                <span style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: '600', display: 'block', marginBottom: '2rem' }}>
                  Publicado el {new Date(selectedArticle.created_at).toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
                
                <p style={{ color: 'var(--text-main)', fontSize: '1.15rem', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>
                  {selectedArticle.content ? selectedArticle.content.replace(/#[a-zA-Z0-9_áéíóúñÁÉÍÓÚÑ]+/g, '').trim() : ''}
                </p>
                
                {/* HASHTAGS EXTRAIDOS AL FINAL */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '2.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
                  {(selectedArticle.content?.match(/#[a-zA-Z0-9_áéíóúñÁÉÍÓÚÑ]+/g) || []).map((tag, i) => (
                    <span key={i} style={{ color: '#2563eb', fontWeight: '600', backgroundColor: '#dbeafe', padding: '0.4rem 1rem', borderRadius: '999px', fontSize: '0.9rem' }}>{tag}</span>
                  ))}
                </div>
             </div>

             {/* ZONA MULTIMEDIA NARANJA (AHORA ABAJO Y MÁS GRANDE) */}
             {(() => {
                let mediaList = [];
                if (selectedArticle.image_url && selectedArticle.image_url.startsWith('[')) {
                   try { mediaList = JSON.parse(selectedArticle.image_url); } catch(e) {}
                } else {
                   if (selectedArticle.image_url) mediaList.push({ type: 'image', url: selectedArticle.image_url });
                   if (selectedArticle.video_url) mediaList.push({ type: 'video', url: selectedArticle.video_url });
                }

                if (mediaList.length === 0) return null;

                return (
                  <div style={{ backgroundColor: 'var(--secondary-orange)', display: 'flex', flexDirection: 'column', gap: '3rem', padding: '3rem 2rem', width: '100%' }}>
                    {mediaList.map((media, i) => {
                      const isYT = media.url && (media.url.includes('youtube.com') || media.url.includes('youtu.be'));
                      return (
                        <div key={i} style={{ width: '100%', position: 'relative' }}>
                          {isYT ? (
                            <iframe src={getEmbedUrl(media.url)} style={{ height: '70vh', minHeight: '400px', width: '100%', display: 'block', borderRadius: '0.75rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)' }} frameBorder="0" allowFullScreen></iframe>
                          ) : media.type === 'video' ? (
                            <video src={media.url} controls style={{ width: '100%', height: 'auto', borderRadius: '0.75rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)', backgroundColor: 'black', display: 'block' }}></video>
                          ) : (
                            <img src={media.url} alt={`multimedia-${i}`} style={{ width: '100%', height: 'auto', borderRadius: '0.75rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)', display: 'block' }} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
             })()}
           </div>
         </div>
       )}
    </>
  );
}

export default Home;
