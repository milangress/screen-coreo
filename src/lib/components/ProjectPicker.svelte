<script lang="ts">
    import { open } from '@tauri-apps/plugin-dialog';
    import { projects } from '$lib/stores/projects';

    export let onProjectSelect: (projectPath: string, markdownFile: string, mode: 'scroller' | 'overview') => void;

    async function pickProject() {
        try {
            const selected = await open({
                directory: true,
                multiple: false,
                defaultPath: 'projects'
            });

            if (selected && typeof selected === 'string') {
                await projects.addProject(selected);
            }
        } catch (err) {
            console.error('Error picking project:', err);
        }
    }

    function handleFileSelect(projectPath: string, fileName: string, mode: 'scroller' | 'overview') {
        onProjectSelect(projectPath, fileName, mode);
    }

    async function handleRefresh(path: string) {
        await projects.refreshProject(path);
    }

    function handleRemove(path: string) {
        projects.removeProject(path);
    }
</script>

<div class="project-picker">
    <button on:click={pickProject}>Add Project</button>
    
    {#if $projects.length > 0}
        <div class="projects-list">
            {#each $projects as project}
                <div class="project">
                    <div class="project-header">
                        <h3>{project.name}</h3>
                        <div class="project-actions">
                            <button 
                                class="icon-button" 
                                on:click={() => handleRefresh(project.path)}
                                title="Refresh files"
                            >
                                🔄
                            </button>
                            <button 
                                class="icon-button" 
                                on:click={() => handleRemove(project.path)}
                                title="Remove project"
                            >
                                ❌
                            </button>
                        </div>
                    </div>
                    <ul class="files-list">
                        {#each project.files.filter(f => f.isMarkdown) as file}
                            <li class="file-item">
                                <button 
                                    class="file-button"
                                    on:click={() => handleFileSelect(project.path, file.name, 'scroller')}
                                >
                                    {file.name}
                                </button>
                                <button 
                                    class="overview-button"
                                    on:click={() => handleFileSelect(project.path, file.name, 'overview')}
                                    title="Open in overview mode"
                                >
                                    🔍
                                </button>
                            </li>
                        {/each}
                    </ul>
                </div>
            {/each}
        </div>
    {:else}
        <p>No projects added yet. Click "Add Project" to get started.</p>
    {/if}
</div>

<style>
    .project-picker {
        padding: 1rem;
    }

    .projects-list {
        margin-top: 1rem;
    }

    .project {
        margin-bottom: 1.5rem;
        padding: 1rem;
        border: 1px solid #ccc;
        border-radius: 4px;
    }

    .project-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
    }

    .project-header h3 {
        margin: 0;
    }

    .project-actions {
        display: flex;
        gap: 0.5rem;
    }

    .icon-button {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0.25rem;
        font-size: 1rem;
    }

    .icon-button:hover {
        opacity: 0.7;
    }

    .files-list {
        list-style: none;
        padding: 0;
        margin: 0;
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

    .file-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .overview-button {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0.25rem;
        font-size: 1rem;
        opacity: 0.6;
    }

    .overview-button:hover {
        opacity: 1;
    }
</style> 