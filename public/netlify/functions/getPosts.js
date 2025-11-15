// netlify/functions/getPosts.js
import { neon } from '@netlify/neon';

export const handler = async () => {
    const sql = neon(); // usa NETLIFY_DATABASE_URL automaticamente

    try {
        const posts = await sql`SELECT * FROM posts`; // lê todos os posts
        return {
            statusCode: 200,
            body: JSON.stringify(posts)
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
