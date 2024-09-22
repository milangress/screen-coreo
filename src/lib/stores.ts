import { writable } from 'svelte/store';
import { listen } from '@tauri-apps/api/event';

export const currentScene = writable<string | null>(null);
export const currentWindows = writable<string[]>([]);

export const audioStreams = writable({
  loaded: new Set<string>(),
  playing: new Set<string>()
});

export const audioInstances = writable<{ [key: string]: { id: string, url: string | null, volume: number } }>({});

// Listen for audio events
listen('audio-instance-created', (event: any) => {
  const { id } = event.payload;
  audioInstances.update(instances => ({...instances, [id]: { id, url: null, volume: 1 }}));
});

listen('audio-loaded', (event: any) => {
  const { id, url } = event.payload;
  audioStreams.update(streams => {
    streams.loaded.add(id);
    return streams;
  });
  audioInstances.update(instances => ({...instances, [id]: { ...instances[id], url }}));
});

listen('audio-play', (event: any) => {
  const { id } = event.payload;
  audioStreams.update(streams => {
    streams.playing.add(id);
    return streams;
  });
});

listen('audio-stop', (event: any) => {
  const { id } = event.payload;
  audioStreams.update(streams => {
    streams.playing.delete(id);
    return streams;
  });
});

listen('audio-volume-change', (event: any) => {
  const { id, volume } = event.payload;
  audioInstances.update(instances => ({...instances, [id]: { ...instances[id], volume }}));
});
