<script lang="ts">
    import { open } from '@tauri-apps/api/dialog';
    import { readDir } from '@tauri-apps/api/fs';
    import { writable } from 'svelte/store';

    export let onProjectSelect: (projectPath: string, markdownFile: string) => void;

    type ProjectFile = {
        name: string;
        path: string;
        isMarkdown: boolean;
    };

    const projectFiles = writable<ProjectFile[]>([]);
    let selectedProject: string | null = null;

    async function pickProject() {
        try {
            const selected = await open({
                directory: true,
                multiple: false,
                defaultPath: 'projects'
            });

            if (selected && typeof selected === 'string') {
                selectedProject = selected;
                const entries = await readDir(selected);
                const files = entries
                    .filter(entry => entry.children === undefined) // Only files, not directories
                    .map(entry => ({
                        name: entry.name || '',
                        path: entry.path,
                        isMarkdown: entry.name?.endsWith('.md') || false
                    }));
                projectFiles.set(files);
                console.log('Found files:', files); // Debug log
            }
        } catch (err) {
            console.error('Error picking project:', err);
        }
    }

    function handleFileSelect(file: ProjectFile) {
        if (selectedProject && file.isMarkdown) {
            console.log('Selected project:', selectedProject); // Debug log
            console.log('Selected file:', file); // Debug log
            onProjectSelect(selectedProject, file.name);
        }
    }
</script>

<div class="project-picker">
    <button on:click={pickProject}>Open Project</button>
    
    {#if $projectFiles.length > 0}
        <div class="files-list">
            <h3>Available Files:</h3>
            <ul>
                {#each $projectFiles as file}
                    {#if file.isMarkdown}
                        <li>
                            <button 
                                on:click={() => handleFileSelect(file)}
                                class="file-button"
                            >
                                {file.name}
                            </button>
                        </li>
                    {/if}
                {/each}
            </ul>
        </div>
    {:else}
        <p>No markdown files found in selected directory.</p>
    {/if}
</div>

<style>
    .project-picker {
        padding: 1rem;
    }

    .files-list {
        margin-top: 1rem;
    }

    .files-list ul {
        list-style: none;
        padding: 0;
    }

    .file-button {
        background: none;
        border: none;
        color: blue;
        text-decoration: underline;
        cursor: pointer;
        padding: 0.25rem 0;
    }

    .file-button:hover {
        color: darkblue;
    }
</style> 