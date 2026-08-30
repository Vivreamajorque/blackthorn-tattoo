// api/flashs-feed.js — Vercel Edge Function
// Lit la base Notion "🎨 Flashs Blackthorn" et sert les planches actives à la page publique
// flash-tattoo-campos-majorque.html — même principe que api/instagram-feed.js
//
// Variables d'environnement Vercel à configurer :
//   NOTION_TOKEN            → clé d'intégration Notion (developers.notion.com → My integrations)
//   NOTION_FLASHS_DB_ID     → 9cdaf3b5-9b02-4264-991b-cb43cec63077
//
// IMPORTANT : l'intégration Notion doit être connectée à la base "🎨 Flashs Blackthorn"
// (bouton "..." en haut de la base Notion → Connexions → ajouter l'intégration).
//
// À savoir : si Tony uploade la photo directement dans Notion (au lieu d'un lien externe),
// l'URL renvoyée par l'API expire au bout d'~1h. Le cache court (120s) ci-dessous limite le
// risque, mais si des images cassent après un moment, la solution durable est de configurer
// un stockage externe (ex: Vercel Blob) au lieu du fichier natif Notion.

export const config = { runtime: 'edge' };

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_FLASHS_DB_ID = process.env.NOTION_FLASHS_DB_ID || '9cdaf3b5-9b02-4264-991b-cb43cec63077';

export default async function handler(req) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    // Cache court : Tony doit voir ses ajouts apparaître vite (pas 1h comme Instagram)
    'Cache-Control': 's-maxage=120, stale-while-revalidate=300',
  };

  if (NOTION_TOKEN) {
    try {
      const resp = await fetch(`https://api.notion.com/v1/databases/${NOTION_FLASHS_DB_ID}/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NOTION_TOKEN}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filter: { property: 'Actif', checkbox: { equals: true } },
          sorts: [{ property: 'Ordre', direction: 'ascending' }],
        }),
      });

      if (!resp.ok) throw new Error('Notion API ' + resp.status);
      const data = await resp.json();

      const flashs = (data.results || [])
        .map(page => {
          const props = page.properties;
          const nom = props.Nom?.title?.[0]?.plain_text || 'Flash';
          const prix = props.Prix?.rich_text?.[0]?.plain_text || '';
          const fileProp = props.Photo?.files?.[0];
          const photo = fileProp?.file?.url || fileProp?.external?.url || null;
          return { id: page.id, nom, prix, photo };
        })
        .filter(f => f.photo); // on n'affiche pas une planche sans photo

      return new Response(JSON.stringify({ flashs, count: flashs.length, source: 'notion' }), { status: 200, headers });
    } catch (err) {
      console.error('Notion Flashs API error:', err.message);
    }
  }

  // Fallback si NOTION_TOKEN absent ou erreur : liste vide, la page affiche un message
  return new Response(JSON.stringify({ flashs: [], count: 0, source: 'fallback' }), { status: 200, headers });
}
