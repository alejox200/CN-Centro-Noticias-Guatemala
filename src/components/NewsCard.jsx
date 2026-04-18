import React from 'react';

export const getEmbedUrl = (url) => {
  if (!url) return null;
  if (url.includes('youtube.com/watch?v=')) {
    const videoId = url.split('v=')[1].split('&')[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }
  if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1].split('?')[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }
  return url;
};

function NewsCard({ article, onClick }) {
  // Configurar multimedia verificando si es formato antiguo o nuevo JSON
  let mediaList = [];
  if (article.image_url && article.image_url.startsWith('[')) {
     try { mediaList = JSON.parse(article.image_url); } catch(e) {}
  } else {
     if (article.image_url) mediaList.push({ type: 'image', url: article.image_url });
     if (article.video_url) mediaList.push({ type: 'video', url: article.video_url });
  }

  const primaryMedia = mediaList.length > 0 ? mediaList[0] : null;
  const isYouTube = primaryMedia?.url && (primaryMedia.url.includes('youtube.com') || primaryMedia.url.includes('youtu.be'));

  // Extraer y limpiar hashtags
  const allHashtags = article.content ? article.content.match(/#[a-zA-Z0-9_áéíóúñÁÉÍÓÚÑ]+/g) || [] : [];
  const displayHashtags = allHashtags.slice(0, 3);
  const extraHashtags = allHashtags.length > 3;
  const plainText = article.content ? article.content.replace(/#[a-zA-Z0-9_áéíóúñÁÉÍÓÚÑ]+/g, '').trim() : '';

  return (
    <article onClick={() => onClick && onClick(article)} style={{ 
      backgroundColor: 'white', 
      borderRadius: '1rem', 
      overflow: 'hidden', 
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      transition: 'transform 0.3s ease',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column'
    }}
    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
    >
      <div onClick={(e) => {
        // Evita que el click abra la ventana flotante completa para que puedas interactuar con los botones del reproductor del video
        if (primaryMedia && (primaryMedia.type === 'video' || isYouTube)) e.stopPropagation();
      }} style={{ width: '100%', backgroundColor: 'black' }}>
        {primaryMedia ? (
          primaryMedia.type === 'video' || isYouTube ? (
            isYouTube ? (
              <iframe src={getEmbedUrl(primaryMedia.url)} title="Video Noticia" frameBorder="0" allowFullScreen style={{ width: '100%', height: '220px', backgroundColor: 'black', display: 'block' }}></iframe>
            ) : (
              <video src={primaryMedia.url} controls style={{ width: '100%', height: '220px', objectFit: 'cover', backgroundColor: 'black', display: 'block' }}></video>
            )
          ) : (
            <img src={primaryMedia.url} alt={article.title} style={{ width: '100%', height: '220px', objectFit: 'cover', display: 'block' }} />
          )
        ) : (
          <div style={{ width: '100%', height: '220px', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>Sin Multimedia</div>
        )}
      </div>
      
      <div style={{ padding: '1.5rem', flex: '1', display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: '1rem' }}>
            <span style={{ 
            backgroundColor: 'var(--secondary-orange)', 
            color: 'white', 
            padding: '0.25rem 0.75rem', 
            borderRadius: '999px',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            textTransform: 'uppercase'
            }}>{article.category || 'General'}</span>
        </div>
        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', color: 'var(--accent-black)', fontWeight: 'bold' }}>{article.title}</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', flex: '1', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', whiteSpace: 'pre-wrap' }}>
          {plainText}
        </p>

        {displayHashtags.length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'center' }}>
            {displayHashtags.map((tag, i) => (
              <span key={i} style={{ color: '#2563eb', fontWeight: 'bold', fontSize: '0.85rem' }}>{tag}</span>
            ))}
            {extraHashtags && <span style={{ color: '#2563eb', fontWeight: 'bold', fontSize: '1.1rem', lineHeight: '1' }}>+</span>}
          </div>
        )}

        <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: '600' }}>
          {new Date(article.created_at).toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>
    </article>
  );
}

export default NewsCard;
