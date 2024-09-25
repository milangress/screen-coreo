import { resolveResource } from '@tauri-apps/api/path'
import { convertFileSrc } from '@tauri-apps/api/tauri';

export async function getAssetUrl(path: string) {
    // const appDataDirPath = await appDataDir();
    // console.log(appDataDirPath);
    // const filePath = await join(appDataDirPath, 'assets/' + path);
    // console.log(filePath);
    const resource = await resolveResource('../static/' + path);
    const assetUrl = convertFileSrc(resource);
    return assetUrl;
}
