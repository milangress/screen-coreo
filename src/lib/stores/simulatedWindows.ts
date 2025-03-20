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
    addWindow: (window: Partial<SimulatedWindow> & { label: string }) => {
        console.log('Adding/updating window:', {
            window,
            existingWindows: get(store)
        });
        
        const existingIndex = get(store).findIndex(w => w.label === window.label);
        if (existingIndex !== -1) {
            const updatedWindows = [...get(store)];
            const existingWindow = updatedWindows[existingIndex];
            
            // Merge the windows, prioritizing existing values for undefined properties
            updatedWindows[existingIndex] = {
                ...window,  // New properties first
                ...existingWindow, // Then existing properties (if not overridden)
                label: window.label, // Always keep the new label
                // Explicitly handle content and filters to prevent overwriting
                content: window.content !== undefined ? window.content : existingWindow.content,
                filters: window.filters !== undefined ? window.filters : existingWindow.filters,
            };

            console.log('Updating existing window at index', existingIndex, 'new state:', updatedWindows);
            store.set(updatedWindows);
        } else {
            // For new windows, ensure all required properties are present
            const newWindow: SimulatedWindow = {
                width: 100,
                height: 100,
                x: 0,
                y: 0,
                ...window
            };
            const newState = [...get(store), newWindow];
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