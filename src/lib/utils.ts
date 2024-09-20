import { appDataDir, join } from '@tauri-apps/api/path';
import { convertFileSrc } from '@tauri-apps/api/tauri';

const appDataDirPath = await appDataDir();

export function getAssetUrl(path: string) {
    const filePath = await join(appDataDirPath, path);
    const assetUrl = convertFileSrc(filePath);
    return assetUrl;
}
