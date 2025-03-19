<script lang="ts">
    import { onMount } from "svelte";
    import { marked } from "marked";
    import { parse as parseYaml } from 'yaml';
    import { appWindow } from "@tauri-apps/api/window";
    import { register, unregister } from "@tauri-apps/api/globalShortcut";
    import { listen } from "@tauri-apps/api/event";
    import ExecutableCodeBlock from "../ExecutableCodeBlock.svelte";
    import { readTextFile } from '@tauri-apps/api/fs';
    import { join } from '@tauri-apps/api/path';

    type CodeContentBlock = {
        type: "component";
        component: typeof ExecutableCodeBlock;
        props: { code: string };
    };

    type HTMLContentBlock = {
        type: "html";
        content: string;
    };

    type ContentBlock = CodeContentBlock | HTMLContentBlock;
    let contentBlocks: ContentBlock[] = [];
    let scrollSpeed = 0;
    let scrollSpeedIncrement = 0.6;
    let scrollerElement: HTMLElement;
    let isPaused = false;

    async function bringWindowToFocus() {
        await appWindow.setFocus();
        await appWindow.unminimize();
    }

    function handleScrollUp() {
        scrollSpeed -= scrollSpeedIncrement;
        console.log("scrolling up, new speed:", scrollSpeed);
    }

    function handleScrollDown() {
        scrollSpeed += scrollSpeedIncrement;
        console.log("scrolling down, new speed:", scrollSpeed);
    }

    function handleScrollerPause() {
        scrollSpeed = 0;
        console.log("scroller paused:", isPaused);
    }

    function autoScroll() {
        if (scrollerElement && !isPaused) {
            if (scrollSpeed !== 0) {
                console.log("Auto-scrolling...", scrollerElement.scrollTop, scrollSpeed);
            }
            scrollerElement.scrollTop += scrollSpeed;
        }
        requestAnimationFrame(autoScroll);
    }

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
                const frontmatter = parseYaml(frontmatterMatch[1]);
                if (frontmatter.template && frontmatter.template !== 'default') {
                    throw new Error(`Invalid template: ${frontmatter.template}`);
                }
                await compileContent(frontmatterMatch[2]);
            } else {
                await compileContent(content);
            }

            // Set window properties
            await appWindow.setAlwaysOnTop(false);
            await appWindow.setDecorations(false);

            // Register global shortcuts
            await register("Control+Space", async () => {
                console.log("bringing scroller window to focus");
                await bringWindowToFocus();
            });

            await register("Left", () => {
                console.log("Left arrow pressed");
                handleScrollUp();
            });

            await register("Right", () => {
                console.log("Right arrow pressed");
                handleScrollDown();
            });

            // Start auto-scroll
            if (scrollerElement) {
                autoScroll();
            }

            // Listen for menu events
            await listen("menu-event", (event) => {
                switch (event.payload) {
                    case "scroller_pause":
                        handleScrollerPause();
                        break;
                    case "scroller_scroll_up":
                        handleScrollUp();
                        break;
                    case "scroller_scroll_down":
                        handleScrollDown();
                        break;
                }
            });
        } catch (err) {
            console.error('Error loading content:', err);
        }

        return () => {
            // Clean up the shortcuts when the component is destroyed
            unregister("Control+Space").catch((err) =>
                console.error("Error unregistering Control+Space shortcut:", err)
            );
            unregister("Left").catch((err) =>
                console.error("Error unregistering Left shortcut:", err)
            );
            unregister("Right").catch((err) =>
                console.error("Error unregistering Right shortcut:", err)
            );
        };
    });

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
        font-family: "Tagettes";
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