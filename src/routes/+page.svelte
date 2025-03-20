<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { windowManager } from "$lib/WindowManager";
    import {
        currentScene,
        currentWindows,
        audioStreams,
        audioInstances,
        videoInstances,
    } from "$lib/stores";
    import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
    import { availableMonitors, type Monitor } from "@tauri-apps/api/window";
    import { LogicalSize } from '@tauri-apps/api/dpi';
    import { listen } from "@tauri-apps/api/event";
    import { emit } from "@tauri-apps/api/event";
    import { v4 as uuidv4 } from "uuid";
    import ProjectPicker from '$lib/components/ProjectPicker.svelte';
const appWindow = getCurrentWebviewWindow()

    let isFaded = false;
    let fadeTimeout: ReturnType<typeof setTimeout> | null = null;
    const FADE_DELAY = 4000;
    let originalSize: LogicalSize | null = null;
    const minimizedWindowSize = new LogicalSize(80, 200);
    const regularWindowSize = new LogicalSize(850, 650);


    let monitors: Monitor[] = [];
    let selectedMonitor: Monitor | null = null;

    let unlistenFunction: (() => void) | undefined;

    onMount(async () => {
        //registerScenes();
        // Don't run the initial scene here
        monitors = await availableMonitors();
        if (monitors.length > 0) {
            selectedMonitor = monitors[0];
        }

        startFadeTimer();

        unlistenFunction = await listen("menu-event", (event) => {
            console.log("Received menu event:", event);
            const command = event.payload as string;
            handleMenuEvent(command);
        });
    });

    // Add this reactive statement
    $: if (isFaded !== undefined) {
        updateWindowSize(isFaded);
    }

    async function updateWindowSize(faded: boolean) {
        console.log("updateWindowSize", faded);
        const factor = await appWindow.scaleFactor();
        const innerSizePhysical = await appWindow.innerSize();
        const currentSize = innerSizePhysical.toLogical(factor);
        console.log("currentSize", currentSize, "factor", factor, "innerSizePhysical", innerSizePhysical);
        await new Promise((resolve) => setTimeout(resolve, 100));

        if (faded) {
            // Save the current size before fading
            originalSize = currentSize;
            await new Promise((resolve) => setTimeout(resolve, 500));
            await appWindow.setSize(minimizedWindowSize);
            console.log("minimized", await appWindow.innerSize());
        } else if (!faded) {
            // Restore the original size when unfading
            // if (originalSize) {
            //   await appWindow.setSize(originalSize);
            //   console.log("restored original size", await appWindow.innerSize());
            // } else {
            await appWindow.setSize(regularWindowSize);
            console.log("restored default size", await appWindow.innerSize());
        }
        // Short delay to ensure the size change has taken effect
        await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Add this function to handle menu events
    function handleMenuEvent(command: string) {
        switch (command) {
            case "close_all":
                windowManager.closeAllWindows();
                break;
            case "close_all_non_main":
                windowManager.closeAllWindowsExceptMain();
                break;
            case "view_overview":
                openOverview();
                break;
            case "scroller_open":
                openScroller();
                break;
            case "scroller_focus":
                focusScroller();
                break;
            case "scroller_close":
                closeScroller();
                break;
            case "scroller_hide":
                hideScroller();
                break;
            case "scroller_show":
                showScroller();
                break;
            default:
                console.log("Unhandled menu event:", command);
        }
    }

    onDestroy(() => {
        if (fadeTimeout) clearTimeout(fadeTimeout);
        if (unlistenFunction) unlistenFunction();
    });



    function handleMonitorChange(event: Event) {
        const index = parseInt((event.target as HTMLSelectElement).value, 10);
        selectedMonitor = monitors[index];
    }

    export const invalidateWindowShadows = async () => {
        const oldSize = await appWindow.outerSize();
        const newSize = new LogicalSize(
            oldSize.width,
            oldSize.height + (Math.random() > 0.5 ? 1 : -1),
        );
        await appWindow.setSize(newSize);
        await appWindow.setSize(oldSize);
    };
    async function openOverview() {
        await windowManager.createWindow("main-overview", {
            title: "Scene Overview",
            width: 1200,
            height: 800,
            url: "overview",
        });
    }
    async function openScroller(url: string = "scroller") {
        await windowManager.createWindow("main-scroller", {
            title: "Scroller",
            transparent: true,
            width: 1200,
            height: 800,
            url: url,
        });
    }
    async function focusScroller() {
        await windowManager.focusWindow("main-scroller");
    }
    async function closeScroller() {
        await windowManager.closeWindow("main-scroller");
    }
    async function hideScroller() {
        await windowManager.hideWindow("main-scroller");
    }
    async function showScroller() {
        await windowManager.showWindow("main-scroller");
    }

    function togglePlay(id: string) {
        const eventId = uuidv4();
        if ($audioStreams.playing.has(id)) {
            emit("audio-stop", { id, eventId });
        } else {
            emit("audio-play", { id, eventId });
        }
    }

    function updateVolume(id: string, event: Event) {
        const volume = parseFloat((event.target as HTMLInputElement).value);
        const eventId = uuidv4();
        emit("audio-volume-change", { id, volume, eventId });
    }

    function toggleMute(id: string) {
        const eventId = uuidv4();
        const instance = $videoInstances[id];
        if (instance) {
            emit("video-mute-toggle", { id, muted: !instance.muted, eventId });
        }
    }

    function updateVideoVolume(id: string, event: Event) {
        const volume = parseFloat((event.target as HTMLInputElement).value);
        const eventId = uuidv4();
        emit("video-volume-change", { id, volume, eventId });
    }

    function startFadeTimer() {
        if (fadeTimeout) clearTimeout(fadeTimeout);
        fadeTimeout = setTimeout(() => {
            isFaded = true;
            invalidateWindowShadows();
        }, FADE_DELAY);
    }

    function resetFade() {
        isFaded = false;
        startFadeTimer();
    }
    function setFade() {
        setTimeout(() => {
            isFaded = true;
            invalidateWindowShadows();
        }, 200);
    }

    async function handleProjectSelect(projectPath: string, markdownFile: string, mode: 'scroller' | 'overview') {
        if (mode === 'overview') {
            await windowManager.createWindow("main-overview", {
                title: "Overview",
                width: 1200,
                height: 800,
                url: `overview?project=${encodeURIComponent(projectPath)}&file=${encodeURIComponent(markdownFile)}`,
            });
        } else {
            await windowManager.createWindow("main-scroller", {
                title: "Scroller",
                transparent: true,
                width: 1200,
                height: 800,
                url: `scroller/default?project=${encodeURIComponent(projectPath)}&file=${encodeURIComponent(markdownFile)}`,
            });
        }
        setFade();
    }
</script>

<main
    data-tauri-drag-region
    class:isFaded
    on:mousemove={resetFade}
    on:mouseenter={resetFade}
    on:mouseleave={setFade}
>
    <div class="mini-info" class:faded={!isFaded}>
        <div class="scene-info">
            <h1>{$currentScene || "✽"}</h1>
            <div class="stack">
                <ul class="open-windows-list">
                    {#each $currentWindows as window}
                        <li>{window}</li>
                    {/each}
                </ul>
            </div>
        </div>
    </div>
    <div class="fade-box" class:faded={isFaded}>
        <!-- <h2>coreo</h2>   -->
        <div class="controlls" data-tauri-drag-region>
            <button on:click={windowManager.closeAllWindows}>Close All</button>
        </div>

        <div class="monitor-selector">
            <label for="monitor-select">Select Monitor:</label>
            <select id="monitor-select" on:change={handleMonitorChange}>
                {#each monitors as monitor, i}
                    <option value={i}
                        >{monitor.name} ({monitor.size.width}x{monitor.size
                            .height})</option
                    >
                {/each}
            </select>
            {#if selectedMonitor}
                <p>
                    Selected Monitor: {selectedMonitor.name} ({selectedMonitor
                        .size.width}x{selectedMonitor.size.height})
                </p>
            {/if}
        </div>
        <div class="open-windows flex">
            <p>Open Windows →</p>
            <ul class="open-windows-list flex-list">
                {#each $currentWindows as window}
                    <li>{window}</li>
                {/each}
            </ul>
        </div>
        <div class="audio-streams flex">
            <p>Loaded Audio Streams →</p>
            <ul class="open-windows-list flex-list">
                {#each Array.from($audioStreams.loaded) as stream}
                    <li>{stream}</li>
                {/each}
            </ul>
        </div>
        <div class="audio-streams flex">
            <p>Playing Audio Streams →</p>
            <ul class="open-windows-list flex-list">
                {#each Array.from($audioStreams.playing) as stream}
                    <li>{stream}</li>
                {/each}
            </ul>
        </div>
        <button on:click={openOverview}>View Overview</button>
        

        <div class="audio-controls">
            <h3>Audio Controls:</h3>
            {#each Object.entries($audioInstances) as [id, instance]}
                <div class="audio-instance">
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={instance.volume}
                        on:input={(event) => updateVolume(id, event)}
                    />
                    <span>{(instance.volume * 100).toFixed(0)}%</span>
                    <button
                        class="small-btn"
                        on:click={() => togglePlay(id)}
                        style={$audioStreams.playing.has(id)
                            ? "background-color: green;"
                            : ""}
                    >
                        {$audioStreams.playing.has(id) ? "Stop" : "Play"}
                    </button>
                    <strong>{id} ({instance.url})</strong>
                </div>
            {/each}
        </div>

        <div class="video-controls">
            <h3>Video Sound Controls:</h3>
            {#each Object.entries($videoInstances) as [id, instance]}
                <div class="video-instance">
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={instance.volume}
                        on:input={(event) => updateVideoVolume(id, event)}
                    />
                    <span>{(instance.volume * 100).toFixed(0)}%</span>
                    <button
                        class="small-btn"
                        on:click={() => toggleMute(id)}
                        style={instance.muted ? "background-color: red;" : ""}
                    >
                        {instance.muted ? "Unmute" : "Mute"}
                    </button>
                    <strong>{id} ({instance.src})</strong>
                </div>
            {/each}
        </div>

        <div class="scroller-section">
            <h3>Project Scroller</h3>
            <ProjectPicker onProjectSelect={handleProjectSelect} />
        </div>
    </div>
</main>

<style>
    *,
    *::before,
    *::after {
        box-sizing: border-box;
    }
    :global(html) {
        background-color: transparent;
        height: 100%;
        width: 100%;
        padding: 0;
        margin: 0;
        accent-color: blue;
    }
    :global(body) {
        width: 100%;
        height: 100%;
        padding: 0;
        margin: 0;
    }

    main {
        padding: 1em;
        width: 100%;
        height: 100%;
        overflow: auto;
        transition:
            opacity 0.3s ease-in-out,
            width 0.3s ease-in-out,
            height 0.3s ease-in-out;
        background-color: white;
        pointer-events: auto;
        padding: 0.5rem;
        margin: 0;
        border: 3px solid black;
    }
    main.isFaded {
        background-color: transparent;
        pointer-events: none;
        width: 250px;
        height: 100px;
        border: none;
    }
    .mini-info {
        margin-top: 0.3rem;
        margin-left: 0.3rem;
        position: fixed;
        pointer-events: auto;
        display: flex;
        white-space: nowrap;
        overflow: hidden;
    }
    .mini-info ul {
        padding-inline-start: 0;
    }
    .faded {
        opacity: 0.05;
        background-color: transparent;
        box-shadow: none;
        pointer-events: none;
    }

    button {
        font-size: 1em;
        padding: 0.5em 1em;
        margin: 0.5em;
    }
    .small-btn {
        padding: 0.25em 0.5em;
    }

    .controlls {
        display: flex;
        align-items: baseline;
    }
    .controlls > * {
        margin-right: 1em;
    }
    .flex {
        display: flex;
        align-items: baseline;
        margin: 0;
    }
    .flex > p {
        width: 250px;
        text-align: right;
    }

    .flex > * {
        margin: 0;
    }
    .flex-list {
        display: flex;
        align-items: baseline;
        list-style: circle;
        gap: 1.5em;
    }
    .scene-info {
        color: #1500ff;
        flex: 1;
    }
    .scene-info h1,
    .scene-info ul {
        margin-block: 0;
    }
    .monitor-selector {
        display: flex;
        align-items: baseline;
    }

    .audio-controls {
        margin-top: 1em;
    }

    .audio-instance {
        display: flex;
        align-items: center;
        margin-bottom: 0.5em;
    }

    .audio-instance > * {
        margin-right: 0.5em;
    }

    .video-controls {
        margin-top: 1em;
    }

    .video-instance {
        display: flex;
        align-items: center;
        margin-bottom: 0.5em;
    }

    .video-instance > * {
        margin-right: 0.5em;
    }
    input[type="range"] {
        accent-color: black;
        height: 1rem;
    }
    input[type="range"]::-webkit-slider-runnable-track {
        background: blue;
        height: 1rem;
    }
    input[type="range"]::-webkit-slider-thumb {
        height: 1rem;
        width: 1rem;
        background: black;
    }

    .scroller-section {
        margin-top: 2rem;
        padding: 1rem;
        border-top: 1px solid #ccc;
    }
</style>
