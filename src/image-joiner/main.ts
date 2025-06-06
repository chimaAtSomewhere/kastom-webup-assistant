import * as zipUtil from './zipUtil';
import * as config from './config';
import * as ui from './ui';
import * as imageProcessor from './imageProcessor';

// ****************************
// * Initialize UI components *
// ****************************

ui.initUI();

// *************
// * Variables *
// *************

let processedImageSets: File[][] = [];

// ***********************
// * Set event listeners *
// ***********************


ui.downloadBtns.forEach((downloadZipBtn, index) => {
  downloadZipBtn.addEventListener("click", async () => {
    if (processedImageSets[index].length > 0) {
      const temp = downloadZipBtn.textContent;
      downloadZipBtn.disabled = true;
      downloadZipBtn.textContent = "ZIPファイル作成中...";
      
      const zipFileName = ui.EcSiteNameInputs[index].value.trim() || config.initEcSiteConfigSet[index].ecSiteName;
      const managementId = ui.managementIdInput.value.trim() || "image";
      
      await zipUtil.packageAndDownloadAsZip(processedImageSets[index], managementId, zipFileName);
      
      downloadZipBtn.disabled = false;
      downloadZipBtn.textContent = temp;
    } else {
      alert("ダウンロードするファイルがありません。まず画像を結合してください。");
    }
  });
})

ui.joinImagesBtn.addEventListener("click", async () => {
  const { inputFiles, ecSiteConfigSet, fileNameBase } = ui.getConfig();

  if (inputFiles.length < 3) {
    alert("画像は3枚以上選択してください");
    return;
  }

  ecSiteConfigSet.forEach(async ({ limitNumber, imageWidth, imageHeight, ecSiteName: managementId }, index) => {
    if (isNaN(limitNumber) || limitNumber <= 0) {
      alert(`${managementId}: 有効な上限枚数を入力してください`);
      return;
    }

    if (inputFiles.length <= limitNumber) {
      const resizedFiles: File[] = await Promise.all(inputFiles.map(file => imageProcessor.resizeImage(file, imageWidth, imageHeight)));
      processedImageSets[index] = resizedFiles;
      const downloadZipBtn: HTMLButtonElement = ui.downloadBtns[index];
      downloadZipBtn.style.display = "inline-block";  
      downloadZipBtn.disabled = false;
      downloadZipBtn.textContent = `ダウンロード(${managementId}.zip) (サイズ変更のみ)`;
      return;
    }

    const netLimitNumber: number = limitNumber - 2;
    const threshold: number = netLimitNumber * 4;
    if (inputFiles.length > threshold) {
      const downloadZipBtn: HTMLButtonElement = ui.downloadBtns[index];
      downloadZipBtn.style.display = "inline-block";  
      downloadZipBtn.disabled = true;
      downloadZipBtn.textContent = `(${managementId}: 画像結合しても枚数上限を満たせません)`;
      return;
    }

    const res: File[] = await imageProcessor.generateImageSet(
      inputFiles,
      limitNumber,
      imageWidth,
      imageHeight
    );

    const resizedRes: File[] = await Promise.all(res.map(file => imageProcessor.resizeImage(file, imageWidth, imageHeight)));
    processedImageSets[index] = resizedRes;

    const downloadZipBtn: HTMLButtonElement = ui.downloadBtns[index];
    if (resizedRes.length > 0) {
      downloadZipBtn.style.display = "inline-block";  
      downloadZipBtn.disabled = false;
      downloadZipBtn.textContent = `ダウンロード(${managementId}.zip)`;
    } else {
      downloadZipBtn.style.display = "none";
    }
  });
});

/**
 * @description 
 * 画像ファイルとそのダウンロードリンクとを表示する．
 * @param imageFiles 
 * @param fileNamePrefix 
 */
function displayImages(imageFiles: File[], fileNamePrefix: string): void {
  ui.galleryContainer.innerHTML = "";

  imageFiles.forEach((imageFile, index) => {
    const imgElement = document.createElement("img");
    imgElement.src = URL.createObjectURL(imageFile);
    imgElement.width = 200;
    imgElement.height = 150;
    ui.galleryContainer.appendChild(imgElement);

    const link = document.createElement("a");
    link.href = URL.createObjectURL(imageFile);
    link.download = `${fileNamePrefix}_${index + 1}.jpeg`;
    link.textContent = `ダウンロード ${fileNamePrefix}_${index + 1}`;
    ui.galleryContainer.appendChild(link);
    ui.galleryContainer.appendChild(document.createElement("br"));
  });
}