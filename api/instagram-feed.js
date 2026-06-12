// api/instagram-feed.js — Vercel Edge Function
// Récupère les 9 derniers posts Instagram de @blackthorntattoo_campos
// Cache 1h côté Vercel CDN pour limiter les requêtes

export const config = { runtime: 'edge' };

const IG_USER = 'blackthorntattoo_campos';

export default async function handler(req) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 's-maxage=3600, stale-while-revalidate=7200',
  };

  try {
    // Endpoint JSON public Instagram (profil public, ne nécessite pas de token)
    const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${IG_USER}`;
    
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        'X-IG-App-ID': '936619743392459',
        'X-ASBD-ID': '198387',
        'Accept': '*/*',
        'Accept-Language': 'fr-FR,fr;q=0.9',
        'Referer': `https://www.instagram.com/${IG_USER}/`,
        'Origin': 'https://www.instagram.com',
      },
    });

    if (!resp.ok) {
      return new Response(JSON.stringify({ posts: [], error: 'IG ' + resp.status }), { status: 200, headers });
    }

    const data = await resp.json();
    const edges = data?.data?.user?.edge_owner_to_timeline_media?.edges ?? [];

    const posts = edges.slice(0, 9).map(e => {
      const n = e.node;
      // Choisir la meilleure miniature (600px ou 1080px)
      const thumb = n.thumbnail_resources?.find(r => r.config_width >= 600)?.src
                 || n.thumbnail_src
                 || n.display_url;
      return {
        id: n.shortcode,
        url: `https://www.instagram.com/p/${n.shortcode}/`,
        thumbnail: thumb,
        alt: (n.edge_media_to_caption?.edges?.[0]?.node?.text ?? 'Tatouage Blackthorn Campos').slice(0, 120),
        likes: n.edge_liked_by?.count ?? 0,
        isVideo: !!n.is_video,
      };
    });

    return new Response(JSON.stringify({ posts, count: posts.length }), { status: 200, headers });

  } catch (err) {
    return new Response(JSON.stringify({ posts: [], error: err.message }), { status: 200, headers });
  }
}
