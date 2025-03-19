<script lang="ts">
    import { onMount } from 'svelte';
    import { marked } from 'marked';
    import { parse as parseYaml } from 'yaml';
    import ExecutableCodeBlock from '../ExecutableCodeBlock.svelte';
    import { readTextFile } from '@tauri-apps/api/fs';
    import { join } from '@tauri-apps/api/path';

    type ContentBlock = {
        type: 'component';
        component: typeof ExecutableCodeBlock;
        props: { code: string };
    } | {
        type: 'html';
        content: string;
    };

    type Frontmatter = {
        template?: string;
        title?: string;
    };

    let contentBlocks: ContentBlock[] = [];
    let frontmatter: Frontmatter = {};
    let scrollSpeed = 0;
    let scrollSpeedIncrement = 0.6;
    let scrollerElement: HTMLElement;
    let isPaused = false;

    onMount(async () => {
        try {
            // Get URL parameters
            const params = new URLSearchParams(window.location.search);
            const projectPath = params.get('project');
            const markdownFile = params.get('file');

            if (!projectPath || !markdownFile) {
                throw new Error('Missing project path or markdown file');
            }

            // Read the markdown file using Tauri's fs API
            const filePath = await join(projectPath, markdownFile);
            const content = await readTextFile(filePath);
            
            // Parse frontmatter
            const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
            if (frontmatterMatch) {
                frontmatter = parseYaml(frontmatterMatch[1]);
                await compileContent(frontmatterMatch[2]);
            } else {
                await compileContent(content);
            }

            if (frontmatter.template && frontmatter.template !== 'default') {
                throw new Error(`Invalid template: ${frontmatter.template}`);
            }

            // Start auto-scroll
            if (scrollerElement) {
                autoScroll();
            }
        } catch (err) {
            console.error('Error loading content:', err);
        }
    });

    function autoScroll() {
        if (scrollerElement && !isPaused) {
            scrollerElement.scrollTop += scrollSpeed;
        }
        requestAnimationFrame(autoScroll);
    }

    async function compileContent(markdownString: string) {
        try {
            const tokens = marked.lexer(markdownString);
            
            contentBlocks = tokens.map((token): ContentBlock => {
                if (token.type === 'code') {
                    return {
                        type: 'component',
                        component: ExecutableCodeBlock,
                        props: { code: token.text }
                    };
                } else {
                    return {
                        type: 'html',
                        content: marked.parser([token])
                    };
                }
            });
        } catch (error) {
            console.error('Error compiling content:', error);
        }
    }
</script>

<div class="scroller" bind:this={scrollerElement}>
    <div class="content fade-text">
        {#if frontmatter.title}
            <h1>{frontmatter.title}</h1>
        {/if}
        {#each contentBlocks as block}
            {#if block.type === 'component'}
                <svelte:component this={block.component} {...block.props} />
            {:else}
                {@html block.content}
            {/if}
        {/each}
    </div>
</div>

<style>
    .scroller {
        height: 100vh;
        overflow-y: scroll;
        padding: 2rem;
        color: black;
        position: relative;
        mask-image: linear-gradient(
            to bottom,
            transparent,
            black 10%,
            black 100%,
            black 10%,
            transparent
        );
        -webkit-mask-image: linear-gradient(
            to bottom,
            transparent 10%,
            black 20%,
            black 80%,
            transparent 90%
        );
    }

    .content {
        margin-top: 50vh;
        font-size: 4rem;
        text-shadow:
            -1px -1px 0 #fff,
            1px -1px 0 #fff,
            -1px 1px 0 #fff,
            1px 1px 0 #fff;
    }

    .fade-text {
        margin-bottom: 1rem;
        transition: opacity 0.3s;
    }
</style> 