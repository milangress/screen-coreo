import { resolveResource, join } from '@tauri-apps/api/path'
import { convertFileSrc } from '@tauri-apps/api/core';

export async function getAssetPath(path: string, projectPath?: string | null): Promise<string> {
    let resource;
    if (projectPath) {
        // If project path is provided directly, use it
        resource = await join(projectPath, path);
    } else {
        // Try to get project path from URL parameters as fallback
        const params = new URLSearchParams(window.location.search);
        const urlProjectPath = params.get('project');

        if (urlProjectPath) {
            resource = await join(urlProjectPath, 'static', path);
        } else {
            // Fallback to static directory if no project path available
            resource = await resolveResource('../static/' + path);
        }
    }
    
    return resource;
}

export async function getAssetUrl(path: string, projectPath?: string | null): Promise<string> {
    const resource = await getAssetPath(path, projectPath);
    return convertFileSrc(resource);
}
