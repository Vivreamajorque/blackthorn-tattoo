// api/instagram-feed.js — Vercel Edge Function
// Affiche les derniers posts Instagram @blackthorntattoo_campos
// Via l'API officielle Instagram Basic Display (token requis) 
// ou fallback sur les photos locales si pas encore configuré

export const config = { runtime: 'edge' };

// Token Instagram Basic Display API
// Générer sur https://developers.facebook.com/apps/
// Ajouter en variable d'environnement Vercel : INSTAGRAM_TOKEN
const IG_TOKEN = process.env.INSTAGRAM_TOKEN;

export default async function handler(req) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 's-maxage=3600, stale-while-revalidate=7200',
  };

  // Si le token est configuré, utiliser l'API officielle
  if (IG_TOKEN) {
    try {
      const url = `https://graph.instagram.com/me/media?fields=id,media_type,media_url,thumbnail_url,permalink,caption&limit=9&access_token=${IG_TOKEN}`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('IG API ' + resp.status);
      const data = await resp.json();
      
      if (data.error) throw new Error(data.error.message);
      
      const posts = (data.data || [])
        .filter(p => p.media_type === 'IMAGE' || p.media_type === 'CAROUSEL_ALBUM' || p.media_type === 'VIDEO')
        .slice(0, 9)
        .map(p => ({
          id: p.id,
          url: p.permalink,
          thumbnail: p.thumbnail_url || p.media_url,
          alt: (p.caption || 'Tatouage Blackthorn Tattoo Campos Majorque').slice(0, 120),
          isVideo: p.media_type === 'VIDEO',
        }));
      
      return new Response(JSON.stringify({ posts, count: posts.length, source: 'api' }), { status: 200, headers });
    } catch (err) {
      // Tomber sur le fallback en cas d'erreur
      console.error('IG API error:', err.message);
    }
  }

  // Fallback : retourner les meilleures photos locales
  const fallback = [
    { id:'1', url:'https://www.instagram.com/blackthorntattoo_campos/', thumbnail:'photos/tatouage-dos-complet-viking-mythologie-nordique-campos-majorque.jpg', alt:'Tatouage dos complet — mythologie viking', isVideo:false },
    { id:'2', url:'https://www.instagram.com/blackthorntattoo_campos/', thumbnail:'photos/tatouage-ornemental-clavicule-epaules-campos-majorque.jpg', alt:'Tatouage ornemental clavicule', isVideo:false },
    { id:'3', url:'https://www.instagram.com/blackthorntattoo_campos/', thumbnail:'photos/tatouage-sleeve-masque-roses-bras-complet-campos-majorque.jpg', alt:'Tatouage sleeve masque et roses', isVideo:false },
    { id:'4', url:'https://www.instagram.com/blackthorntattoo_campos/', thumbnail:'photos/tatouage-arbre-vie-aigle-dos-complet-campos-majorque.jpg', alt:'Tatouage arbre de vie avec aigle', isVideo:false },
    { id:'5', url:'https://www.instagram.com/blackthorntattoo_campos/', thumbnail:'photos/tatouage-phoenix-demi-manchette-campos-majorque.jpg', alt:'Tatouage phoenix demi-manchette', isVideo:false },
    { id:'6', url:'https://www.instagram.com/blackthorntattoo_campos/', thumbnail:'photos/tatouage-lion-lionceau-realiste-mollet-campos-majorque.jpg', alt:'Tatouage lion et lionceau', isVideo:false },
    { id:'7', url:'https://www.instagram.com/blackthorntattoo_campos/', thumbnail:'photos/tatouage-mandala-ornemental-sternum-campos-majorque.jpg', alt:'Tatouage mandala ornemental', isVideo:false },
    { id:'8', url:'https://www.instagram.com/blackthorntattoo_campos/', thumbnail:'photos/tatouage-ange-guerrier-avant-bras-campos-majorque.jpg', alt:'Tatouage ange guerrier', isVideo:false },
    { id:'9', url:'https://www.instagram.com/blackthorntattoo_campos/', thumbnail:'photos/tatouage-papillon-geometrique-lune-avant-bras-campos-majorque.jpg', alt:'Tatouage papillon géométrique', isVideo:false },
  ];

  return new Response(JSON.stringify({ posts: fallback, count: fallback.length, source: 'fallback' }), { status: 200, headers });
}
