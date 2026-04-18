import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../utils/supabase';

function Admin() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Lista de noticias
  const [allNews, setAllNews] = useState([]);
  
  // Variables del Formulario
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [content, setContent] = useState('');
  const [mediaItems, setMediaItems] = useState([]); // Array para hasta 5 archivos
  const [message, setMessage] = useState('');
  
  const fileInputRef = useRef(null);

  // Inicializar auth y cargar noticias
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if(session) fetchAllNews();
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if(session) fetchAllNews();
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchAllNews = async () => {
    const { data } = await supabase.from('noticias').select('*').order('created_at', { ascending: false });
    if (data) setAllNews(data);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('Iniciando sesión...');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMessage(`Error de login: ${error.message}`);
    else setMessage('');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    addFilesToMediaList(files);
  };

  const addFilesToMediaList = (files) => {
    if (mediaItems.length + files.length > 5) {
      setMessage("❌ Ojo: El límite máximo es de 5 archivos multimedia por noticia.");
      return;
    }
    const newMedia = files.map(f => ({
      file: f,
      type: f.type.startsWith('video') ? 'video' : 'image',
      url: URL.createObjectURL(f), 
      isLocal: true // Indica que necesita subida
    }));
    setMediaItems([...mediaItems, ...newMedia]);
  };

  const addLinkUrl = () => {
    const url = prompt("Pega la URL de tu imagen o de YouTube");
    if (!url) return;
    if (mediaItems.length >= 5) {
      setMessage("❌ Máximo 5 archivos superado.");
      return;
    }
    setMediaItems([...mediaItems, {
      file: null,
      type: (url.includes('youtube') || url.includes('youtu.be') || url.endsWith('.mp4')) ? 'video' : 'image',
      url: url,
      isLocal: false
    }]);
  };

  const removeMedia = (index) => {
    const updated = [...mediaItems];
    updated.splice(index, 1);
    setMediaItems(updated);
  };

  const handleEdit = (article) => {
    setEditingId(article.id);
    setTitle(article.title);
    setCategory(article.category);
    setContent(article.content);
    
    // Parse previously saved multimedia
    let parsedMedia = [];
    if (article.image_url && article.image_url.startsWith('[')) {
      try { parsedMedia = JSON.parse(article.image_url); } catch(e){}
    } else {
      if (article.image_url) parsedMedia.push({ type: 'image', url: article.image_url });
      if (article.video_url) parsedMedia.push({ type: 'video', url: article.video_url });
    }
    setMediaItems(parsedMedia);
    setMessage(`✏️ Editando noticia: "${article.title}"`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta noticia permanentemente?")) return;
    const { error } = await supabase.from('noticias').delete().eq('id', id);
    if (!error) {
      setMessage("🗑️ Noticia eliminada.");
      fetchAllNews();
    } else {
      setMessage(`Error al eliminar: ${error.message}`);
    }
  };

  const clearForm = () => {
    setEditingId(null);
    setTitle('');
    setCategory('');
    setContent('');
    setMediaItems([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('Procesando publicación y subiendo archivos... (Puede tardar si hay videos de por medio)');
    
    let finalMediaArray = [];

    // Subir cada archivo local a Supabase
    for (let item of mediaItems) {
      if (item.isLocal && item.file) {
        const fileExt = item.file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage.from('multimedia').upload(fileName, item.file);
        if (uploadError) {
          setMessage(`Error subiendo ${item.file.name}: ${uploadError.message}`);
          return;
        }
        const { data: { publicUrl } } = supabase.storage.from('multimedia').getPublicUrl(fileName);
        finalMediaArray.push({ type: item.type, url: publicUrl });
      } else {
        // Ya es una URL de internet o de supase previamente guardada
        finalMediaArray.push({ type: item.type, url: item.url });
      }
    }

    // Convertimos a JSON para guardarlo todo en la misma columna ya existente
    const finalMediaJson = JSON.stringify(finalMediaArray);

    const payload = { 
      title, 
      category, 
      content, 
      image_url: finalMediaJson, // Reutilizamos esta columna para todo el array
      video_url: null // Dejamos video_url vacio por compatibilidad
    };

    let error;
    if (editingId) {
      const res = await supabase.from('noticias').update(payload).eq('id', editingId);
      error = res.error;
    } else {
      const res = await supabase.from('noticias').insert([payload]);
      error = res.error;
    }
    
    if (error) {
      setMessage(`Error al publicar: ${error.message}`);
    } else {
      setMessage(editingId ? '¡Cambios guardados con éxito!' : '¡Noticia publicada con éxito!');
      clearForm();
      fetchAllNews();
    }
  };

  return (
    <>
      <Navbar />
      <div className="container" style={{ marginTop: '3rem', marginBottom: '3rem' }}>
        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--primary-green)' }}>⚙️ Panel de Administración</h2>
          
          {message && <div style={{ padding: '1rem', backgroundColor: '#e2e8f0', marginBottom: '1rem', borderRadius: '0.5rem', color: 'var(--text-main)', fontWeight: '600' }}>{message}</div>}

          {!session ? (
            <div style={{ maxWidth: '400px', margin: '0 auto' }}>
              <p style={{ marginBottom: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>Inicia sesión para gestionar noticias.</p>
              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input type="email" placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }} />
                <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }} />
                <button type="submit" className="btn-primary" style={{ width: '100%' }}>Iniciar Sesión</button>
              </form>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <p style={{ fontWeight: '600' }}>Sesión activa: <span style={{ color: 'var(--secondary-orange)' }}>{session.user.email}</span></p>
                <button onClick={handleLogout} className="btn-secondary">Cerrar Sesión</button>
              </div>

              {/* FORMULARIO */}
              <h3 style={{ marginBottom: '1.5rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem', color: editingId ? 'var(--secondary-orange)' : 'var(--text-main)' }}>
                 {editingId ? `Editando Nota Existente` : `Escribir Nueva Noticia`}
                 {editingId && <button onClick={clearForm} style={{ marginLeft: '1rem', fontSize: '0.8rem', padding: '0.2rem 0.5rem', backgroundColor: '#e2e8f0', border: 'none', cursor: 'pointer', borderRadius: '0.2rem' }}>Cancelar Edición</button>}
              </h3>
              
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px', marginBottom: '4rem' }}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: '2 1 300px' }}>
                    <label style={{ fontWeight: '600' }}>Título de la noticia</label>
                    <input type="text" placeholder="Ej: Importante descubrimiento..." value={title} onChange={(e) => setTitle(e.target.value)} required style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '1rem' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: '1 1 200px' }}>
                    <label style={{ fontWeight: '600' }}>Categoría</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} required style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '1rem', backgroundColor: 'white' }}>
                      <option value="">Selecciona...</option>
                      <option value="Nacionales">Nacionales</option>
                      <option value="Internacionales">Internacionales</option>
                      <option value="Deportes">Deportes</option>
                      <option value="Tecnología">Tecnología</option>
                      <option value="Cultura">Cultura</option>
                      <option value="Entretenimiento">Entretenimiento</option>
                    </select>
                  </div>
                </div>

                {/* MULTIPLE UPLOADS */}
                <div style={{ padding: '1.5rem', backgroundColor: '#f8fafc', border: '2px dashed #94a3b8', borderRadius: '0.5rem' }}>
                    <label style={{ fontWeight: '600', color: 'var(--primary-green)', display: 'block', marginBottom: '1rem', fontSize: '1.1rem' }}>
                      📸 Multimedia (Agrega hasta 5 elementos)
                    </label>
                    
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                      <input 
                        type="file" multiple accept="image/*,video/mp4,video/webm" 
                        ref={fileInputRef} onChange={handleFileChange} 
                        style={{ flex: 1, padding: '0.5rem', backgroundColor: 'white', borderRadius: '0.25rem', border: '1px solid #cbd5e1' }} 
                        disabled={mediaItems.length >= 5}
                      />
                      <button type="button" onClick={addLinkUrl} disabled={mediaItems.length >= 5} style={{ padding: '0.5rem 1rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem', cursor: 'pointer', backgroundColor: 'white' }}>
                        🔗 Añadir Enlace Libre
                      </button>
                    </div>

                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Manejados actualmente: {mediaItems.length}/5</p>

                    {mediaItems.length > 0 && (
                      <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingTop: '1rem' }}>
                        {mediaItems.map((item, i) => (
                           <div key={i} style={{ position: 'relative', flex: '0 0 auto', width: '150px', height: '150px', backgroundColor: 'black', borderRadius: '0.5rem', overflow: 'hidden' }}>
                              <button type="button" onClick={() => removeMedia(i)} style={{ position: 'absolute', top: '5px', right: '5px', background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '25px', height: '25px', cursor: 'pointer', zIndex: 10 }}>X</button>
                              {item.type === 'video' ? (
                                <video src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <img src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              )}
                           </div>
                        ))}
                      </div>
                    )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontWeight: '600' }}>Contenido / Cuerpo de la nota</label>
                  <textarea placeholder="Escribe tu nota completa aquí... (Usa #hashtags)" value={content} onChange={(e) => setContent(e.target.value)} required style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '1rem', minHeight: '200px', resize: 'vertical' }}></textarea>
                  
                  {content.includes('#') && content.match(/#[a-zA-Z0-9_áéíóúñÁÉÍÓÚÑ]+/g) && (
                    <div style={{ padding: '1rem', backgroundColor: '#f1f5f9', borderRadius: '0.5rem', marginTop: '0.5rem', border: '1px solid #e2e8f0' }}>
                      <p style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>Hashtags Detectados:</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {content.match(/#[a-zA-Z0-9_áéíóúñÁÉÍÓÚÑ]+/g).map((tag, i) => 
                          <span key={i} style={{ color: '#2563eb', fontWeight: '600', backgroundColor: '#dbeafe', padding: '0.2rem 0.75rem', borderRadius: '999px', border: '1px solid #bfdbfe', fontSize: '0.9rem' }}>{tag}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start', fontSize: '1.1rem', padding: '1rem 2rem' }}>
                  {editingId ? '💾 Guardar Cambios' : '🚀 Publicar Noticia'}
                </button>
              </form>

              {/* LISTA GESTION EDITOR */}
              <h3 style={{ marginBottom: '1.5rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem' }}>Gestión de Noticias Publicadas</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                      <th style={{ padding: '1rem' }}>Título</th>
                      <th style={{ padding: '1rem' }}>Categoría</th>
                      <th style={{ padding: '1rem' }}>Fecha</th>
                      <th style={{ padding: '1rem' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allNews.map(n => (
                      <tr key={n.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '1rem', fontWeight: '500' }}>{n.title}</td>
                        <td style={{ padding: '1rem' }}>{n.category}</td>
                        <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{new Date(n.created_at).toLocaleDateString()}</td>
                        <td style={{ padding: '1rem' }}>
                          <button onClick={() => handleEdit(n)} style={{ marginRight: '0.5rem', padding: '0.4rem 0.8rem', backgroundColor: 'var(--primary-green)', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontWeight: 'bold' }}>Editar</button>
                          <button onClick={() => handleDelete(n.id)} style={{ padding: '0.4rem 0.8rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontWeight: 'bold' }}>Eliminar</button>
                        </td>
                      </tr>
                    ))}
                    {allNews.length === 0 && <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center' }}>No hay noticias publicadas.</td></tr>}
                  </tbody>
                </table>
              </div>

            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Admin;
