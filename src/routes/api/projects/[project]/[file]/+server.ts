import { error } from '@sveltejs/kit';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET({ params }) {
    try {
        const { project, file } = params;
        const filePath = join(process.cwd(), 'projects', project, file);
        
        const content = await readFile(filePath, 'utf-8');
        return new Response(content, {
            headers: {
                'Content-Type': 'text/markdown'
            }
        });
    } catch (err) {
        throw error(404, 'Project file not found');
    }
} 