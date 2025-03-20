import { writable } from 'svelte/store';
import { readDir } from '@tauri-apps/plugin-fs';

export type Project = {
    path: string;
    name: string;
    files: Array<{
        name: string;
        isMarkdown: boolean;
    }>;
};

function createProjectsStore() {
    // Initialize from localStorage if available
    const storedProjects = typeof window !== 'undefined' ? 
        JSON.parse(localStorage.getItem('projects') || '[]') : 
        [];
    
    const { subscribe, set, update } = writable<Project[]>(storedProjects);

    return {
        subscribe,
        async addProject(path: string) {
            try {
                const entries = await readDir(path);
                const files = entries
                    .filter(entry => entry.children === undefined)
                    .map(entry => ({
                        name: entry.name || '',
                        isMarkdown: entry.name?.endsWith('.md') || false
                    }));

                const project = {
                    path,
                    name: path.split('/').pop() || path,
                    files
                };

                update(projects => {
                    const newProjects = [...projects.filter(p => p.path !== path), project];
                    localStorage.setItem('projects', JSON.stringify(newProjects));
                    return newProjects;
                });
            } catch (err) {
                console.error('Error adding project:', err);
            }
        },

        async refreshProject(path: string) {
            try {
                const entries = await readDir(path);
                const files = entries
                    .filter(entry => entry.children === undefined)
                    .map(entry => ({
                        name: entry.name || '',
                        isMarkdown: entry.name?.endsWith('.md') || false
                    }));

                update(projects => {
                    const newProjects = projects.map(p => 
                        p.path === path ? { ...p, files } : p
                    );
                    localStorage.setItem('projects', JSON.stringify(newProjects));
                    return newProjects;
                });
            } catch (err) {
                console.error('Error refreshing project:', err);
            }
        },

        removeProject(path: string) {
            update(projects => {
                const newProjects = projects.filter(p => p.path !== path);
                localStorage.setItem('projects', JSON.stringify(newProjects));
                return newProjects;
            });
        }
    };
}

export const projects = createProjectsStore(); 