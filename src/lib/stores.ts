import { writable } from 'svelte/store';

export const currentScene = writable<string | null>(null);