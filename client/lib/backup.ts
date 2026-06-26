import * as FileSystem from "expo-file-system";

export type BackupResult =
  | { savedTo: "remote" }
  | { savedTo: "device"; fileUri: string };

/**
 * Saves the backup JSON to a folder the user picks, making it accessible
 * outside the app's private storage (Android Storage Access Framework).
 * Returns the created file's URI, or throws if the user denies access.
 */
export async function saveBackupToDevice(
  fileName: string,
  contents: string,
): Promise<string> {
  const permissions =
    await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

  if (!permissions.granted) {
    throw new Error("Storage permission denied, backup was not saved.");
  }

  const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
    permissions.directoryUri,
    fileName,
    "application/json",
  );

  await FileSystem.writeAsStringAsync(fileUri, contents, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  return fileUri;
}
