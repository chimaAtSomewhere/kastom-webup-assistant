import JSZip from "jszip";


/**
 * @description 
 * 画像ファイルを zip したものをダウンロードする．
 * エラー時はアラートを表示する．
 * zip ファイルの名前は `filename` とする．
 * @param {JSZip} zip 
 * @param {string} filename 
 * @returns {Promise<void>}
 */
async function downloadZip(zip: JSZip, filename: string): Promise<void> {
  try {
    const zipContent: Blob = await zip.generateAsync({ type: "blob" });

    if (!zipContent || zipContent.size === 0) {
      alert("ZIPファイルの生成に失敗しました。コンテンツが空です。");
      return;
    }

    const link = document.createElement("a");
    link.href = URL.createObjectURL(zipContent);

    link.download = filename;
    document.body.appendChild(link);

    link.click();

    setTimeout(() => {
      URL.revokeObjectURL(link.href);
      document.body.removeChild(link);
    }, 1000); // 1000ミリ秒待つ (この時間は調整が必要な場合があります)

  } catch (error) {
    alert("ZIPファイルの生成またはダウンロードに失敗しました。コンソールを確認してください。");
  }
}

/**
 * @description 
 * 画像ファイルを zip したものをダウンロードする．
 * エラー時はアラートを表示する．
 * zip ファイルの名前は `${ecSiteName}_${managementId}.zip`，
 * 画像ファイルは `${managementId}_${index+1}.jpeg` とする．
 * @param {File[]} imageFiles 
 * @param {string} managementId 
 * @param {string} ecSiteName 
 * @returns {Promise<void>}
 */
export async function packageAndDownloadAsZip(imageFiles: File[], managementId: string, ecSiteName: string): Promise<void> {
  const zip = new JSZip();

  imageFiles.forEach((file, index) => {
    const fileNumber = String(index + 1).padStart(2, '0');
    const filenameInZip = `${managementId}_${fileNumber}.${file.name.split('.').pop() || 'jpeg'}`;
    zip.file(filenameInZip, file);
  });

  const zipFilename = `${ecSiteName}_${managementId}.zip`;
  await downloadZip(zip, zipFilename);
}

/**
 * @description
 * 画像ファイルを zip したものをダウンロードする．
 * zip ファイルの名前は `${managedId}.zip`．
 * これを展開すると `${ecSiteName[index]}` の名前のフォルダができ，
 * その中に `${managementId}_${index+1}.jpeg` 画像ファイルが入る．
 * @param {File[]} imageFiles 
 * @param {string} managementId 
 * @param {string[]} ecSiteNames
 * @returns {Promise<void>}
 */
export async function packageAllAndDownloadAsZip(imageFileSets: File[][], managementId: string, ecSiteNames: string[]): Promise<void> {
  const zip = new JSZip();

  imageFileSets.forEach((imageFiles, index) => {
    if (imageFiles.length === 0) {
      return;
    }
    const ecSiteName = ecSiteNames[index];
    const folder = zip.folder(ecSiteName);
    if (folder) {
      imageFiles.forEach((file, fileIndex) => {
        const filenameInZip = `${managementId}_${(fileIndex+1 < 10 ? '0' : '') + (fileIndex + 1)}.${file.name.split('.').pop() || 'jpeg'}`;
        folder.file(filenameInZip, file);
      });
    }
  });

  const zipFilename = `${managementId}.zip`;
  await downloadZip(zip, zipFilename);
}