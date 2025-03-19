import { resolveResource, join } from '@tauri-apps/api/path'
import { convertFileSrc } from '@tauri-apps/api/tauri';

export async function getAssetUrl(path: string, projectPath?: string | null) {
    console.log('getAssetUrl', path);

    let resource;
    if (projectPath) {
        // If project path is provided directly, use it
        resource = await join(projectPath, path);
    } else {
        // Try to get project path from URL parameters as fallback
        const params = new URLSearchParams(window.location.search);

        console.log('params', params);
        const urlProjectPath = params.get('project');

        console.log('urlProjectPath', urlProjectPath);

        if (urlProjectPath) {
            resource = await join(urlProjectPath, 'static', path);
        } else {
            // Fallback to static directory if no project path available
            resource = await resolveResource('../static/' + path);
        }
    }
    
    const assetUrl = convertFileSrc(resource);
    return assetUrl;
}
