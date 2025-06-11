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

ui.downloadAllBtn.addEventListener("click", async () => {
  const isProcessing = processedImageSets.some((set,index) => {
    const isEmpty = set.length === 0;
    const isSelected = ui.getConfig().ecSiteConfigSet[index].isSelected;
    return isEmpty && isSelected;
  });
  if (isProcessing) {
    return;
  } else {
    const temp = ui.downloadAllBtn.textContent;
    ui.downloadAllBtn.disabled = true;
    ui.downloadAllBtn.textContent = "ZIPファイル作成中...";

    const managedId: string = ui.getConfig().managementId || "image";
    const ecSiteNames: string[] = ui.getConfig().ecSiteConfigSet.map(config => config.ecSiteName);
    await zipUtil.packageAllAndDownloadAsZip(processedImageSets, managedId, ecSiteNames);

    ui.downloadAllBtn.disabled = false;
    ui.downloadAllBtn.textContent = temp;
  }
});



ui.downloadBtns.forEach((downloadZipBtn, index) => {
  downloadZipBtn.addEventListener("click", async () => {
    if (processedImageSets[index].length > 0) {
      const temp = downloadZipBtn.textContent;
      downloadZipBtn.disabled = true;
      downloadZipBtn.textContent = "ZIPファイル作成中...";
      
      const zipFileName = ui.getConfig().ecSiteConfigSet[index].ecSiteName || "image";
      const managementId = ui.getConfig().managementId || "image";

      await zipUtil.packageAndDownloadAsZip(processedImageSets[index], managementId, zipFileName);
      
      downloadZipBtn.disabled = false;
      downloadZipBtn.textContent = temp;
    } else {
      alert("ダウンロードするファイルがありません。まず画像を結合してください。");
    }
  });
})

ui.joinImagesBtn.addEventListener("click", async () => {
  const tmpProcessedImageSets: File[][] = processedImageSets;
  ui.downloadAllBtn.disabled = true;
  ui.downloadBtns.forEach(btn => btn.disabled = true);
  ui.joinImagesBtn.disabled = true;

  const { inputFiles, ecSiteConfigSet, managementId } = ui.getConfig();
  
  if (inputFiles.length < 3) {
    ui.joinImagesBtn.disabled = false;
    ui.downloadAllBtn.disabled = false;
    ui.downloadBtns.forEach(btn => btn.disabled = false);
    processedImageSets = tmpProcessedImageSets;
    alert("画像は3枚以上選択してください");
    return;
  }

  // ui.showLoadingIndicator();  

  const promises: Promise<void>[] = 
    ecSiteConfigSet.map(async ({ isSelected, ecSiteName, limitNumber, isToResize, imageWidth, imageHeight }, index) => {
      if (!isSelected) {
        processedImageSets[index] = [];
        return;
      }

      if (isNaN(limitNumber) || limitNumber <= 0) {
        processedImageSets[index] = [];
        alert(`${ecSiteName}: 有効な上限枚数を入力してください`);
        return;
      }

      if (inputFiles.length <= limitNumber) {
        if (isToResize) {
          const resizedFiles: File[] = await Promise.all(inputFiles.map(file => imageProcessor.resizeImage(file, imageWidth, imageHeight)));
          processedImageSets[index] = resizedFiles;
          const downloadZipBtn: HTMLButtonElement = ui.downloadBtns[index];
          downloadZipBtn.disabled = false;
          downloadZipBtn.textContent = `ダウンロード ${ecSiteName} (サイズ変更のみ)`;
        } else {
          processedImageSets[index] = inputFiles;
          const downloadZipBtn: HTMLButtonElement = ui.downloadBtns[index];
          downloadZipBtn.disabled = false;
          downloadZipBtn.textContent = `ダウンロード ${ecSiteName} (ファイル名変更のみ)`;
        }
        return;
      }

      const netLimitNumber: number = limitNumber - 2;
      const threshold: number = netLimitNumber * 4;
      if (inputFiles.length > threshold) {
        const downloadZipBtn: HTMLButtonElement = ui.downloadBtns[index];
        downloadZipBtn.style.display = "inline-block";  
        downloadZipBtn.disabled = true;
        downloadZipBtn.textContent = `(${ecSiteName}: 画像結合しても枚数上限を満たせません)`;
        return;
      }

      const res: File[] = await imageProcessor.generateImageSet(
        inputFiles,
        limitNumber,
        imageWidth,
        imageHeight
      );

      const resizedRes: File[] = 
        isToResize && imageWidth > 0 && imageHeight > 0
          ? await Promise.all(res.map(file => imageProcessor.resizeImage(file, imageWidth, imageHeight)))
          : res;
      processedImageSets[index] = resizedRes;

      const downloadZipBtn: HTMLButtonElement = ui.downloadBtns[index];
      if (resizedRes.length > 0) {
        ui.downloadBtns[index].disabled = false;
        downloadZipBtn.textContent = `ダウンロード ${ecSiteName}`;
      }
    });

  await Promise.all(promises);
  ui.downloadAllBtn.disabled = false;
  ui.joinImagesBtn.disabled = false;
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