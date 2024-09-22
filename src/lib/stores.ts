import { writable } from 'svelte/store';
import { listen } from '@tauri-apps/api/event';

export const currentScene = writable<string | null>(null);
export const currentWindows = writable<Set<string>>(new Set());

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

// Listen for window events
listen('window-created', (event: any) => {
  const { label } = event.payload;
  currentWindows.update(windows => {
    windows.add(label);
    return new Set(windows);
  });
});

listen('window-closed', (event: any) => {
  const { label } = event.payload;
  currentWindows.update(windows => {
    windows.delete(label);
    return new Set(windows);
  });
});

// Add these listeners for video events
export const videoInstances = writable<{ [key: string]: { id: string, src: string, volume: number, muted: boolean } }>({});

listen('video-instance-created', (event: any) => {
  const { id, src } = event.payload;
  videoInstances.update(instances => ({...instances, [id]: { id, src, volume: 1, muted: false }}));
});

listen('video-volume-change', (event: any) => {
  const { id, volume } = event.payload;
  videoInstances.update(instances => ({...instances, [id]: { ...instances[id], volume }}));
});

listen('video-mute-toggle', (event: any) => {
  const { id, muted } = event.payload;
  videoInstances.update(instances => ({...instances, [id]: { ...instances[id], muted }}));
});

listen('video-instance-removed', (event: any) => {
  const { id } = event.payload;
  videoInstances.update(instances => {
    const { [id]: _, ...rest } = instances;
    return rest;
  });
});

listen('video-ended', (event: any) => {
  const { id } = event.payload;
  // You can add any specific logic here for when a video ends
  console.log(`Video ${id} has ended`);
});
