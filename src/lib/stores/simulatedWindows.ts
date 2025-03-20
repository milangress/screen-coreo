import { writable } from 'svelte/store';

export type SimulatedWindow = {
    label: string;
    width: number;
    height: number;
    x: number;
    y: number;
    content?: {
        type: string;
        props: Record<string, any>;
    };
};

function createSimulatedWindowsStore() {
    const { subscribe, set, update } = writable<SimulatedWindow[]>([]);

    return {
        subscribe,
        addWindow: (window: SimulatedWindow) => update(windows => [...windows, window]),
        removeWindow: (label: string) => update(windows => windows.filter(w => w.label !== label)),
        updateWindow: (label: string, updates: Partial<SimulatedWindow>) => 
            update(windows => windows.map(w => 
                w.label === label ? { ...w, ...updates } : w
            )),
        clear: () => set([])
    };
}

export const simulatedWindows = createSimulatedWindowsStore(); 