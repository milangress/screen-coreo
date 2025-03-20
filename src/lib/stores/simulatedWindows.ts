import { writable, get } from 'svelte/store';

export type SimulatedWindow = {
    label: string;
    width: number;
    height: number;
    x: number;
    y: number;
    content?: {
        type: string;
        props: Record<string, any>;
    } | null;
    filters?: Record<string, string>;
};

const store = writable<SimulatedWindow[]>([]);

export const simulatedWindows = {
    subscribe: store.subscribe,
    addWindow: (window: SimulatedWindow) => {
        console.log('Adding/updating window:', {
            window,
            existingWindows: get(store)
        });
        
        const existingIndex = get(store).findIndex(w => w.label === window.label);
        if (existingIndex !== -1) {
            const updatedWindows = [...get(store)];
            updatedWindows[existingIndex] = window;
            console.log('Updating existing window at index', existingIndex, 'new state:', updatedWindows);
            store.set(updatedWindows);
        } else {
            const newState = [...get(store), window];
            console.log('Added new window, new state:', newState);
            store.set(newState);
        }
    },
    removeWindow: (label: string) => {
        console.log('Removing window:', label);
        const newState = get(store).filter(w => w.label !== label);
        console.log('State after removal:', newState);
        store.set(newState);
    },
    clear: () => {
        console.log('Clearing all windows');
        store.set([]);
    }
}; 