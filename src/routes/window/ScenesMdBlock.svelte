<script lang="ts">
import scenesContent from '../../routes/scroller/arachovitika-salim/scenes.md?raw';
import { createHighlighter } from 'shiki';
import { onMount } from 'svelte';

let html: string;

onMount(async () => {
    const highlighter = await createHighlighter({
        themes: ['vitesse-dark'],
        langs: ['markdown', 'javascript']
    });

    // First pass: Transform the content to handle code blocks
    const transformedContent = scenesContent.replace(
        /```js\n([\s\S]*?)```/g,
        (match, code) => {
            // Highlight the JS code
            // const highlightedJs = highlighter.codeToHtml(code.trim(), { 
            //     lang: 'javascript',
            //     theme: 'vitesse-dark'
            // });
            // Return the highlighted code wrapped in markdown code fence
            const highlightedJs = code
            return `\`\`\`js\n${highlightedJs}\n\`\`\``;
        }
    );

    // Second pass: Highlight the entire document as markdown
    html = highlighter.codeToHtml(transformedContent, {
        lang: 'markdown',
        theme: 'vitesse-dark'
    });
})
</script>

<div class="code-wrapper">
    {@html html}
</div>

<style>
    .code-wrapper {
        max-width: 100%;
        padding: 2rem;
        overflow-y: hidden;
        background-color: #000;
    }
    :global(.code-wrapper > pre) {
        margin: 1rem;
        overflow-y: scroll;
        font-size: 1.3rem;
    }
    /* Add styles for nested code blocks */
    :global(.code-wrapper pre pre) {
        margin: 1rem 0;
        background: rgba(0,0,0,0.2);
        padding: 1rem;
    }
</style>
