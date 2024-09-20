import { appDataDir, join } from '@tauri-apps/api/path';
import { convertFileSrc } from '@tauri-apps/api/tauri';

export async function getAssetUrl(path: string) {
    const appDataDirPath = await appDataDir();
    console.log(appDataDirPath);
    const filePath = await join(appDataDirPath, 'assets/' + path);
    console.log(filePath);
    const assetUrl = convertFileSrc(filePath);
    return assetUrl;
}
