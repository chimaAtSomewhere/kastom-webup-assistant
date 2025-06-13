import * as zipUtil from './zipUtil';
import * as config from './config';
import * as ui from './ui';
import * as imageProcessor from './imageProcessor';

// *****************
// * UI components *
// *****************

ui.initUI();

// *************
// * Variables *
// *************

let processedImageSets: File[][] = new Array(config.ecSiteCount).fill([]);
let activeTabIndex: number = 1;
enum ProcessStatus {
  NOT_PROCESSED = "未処理",
  PROCESSING = "処理中",
  PROCESSED = "処理済み"
}
let processStatus: ProcessStatus = ProcessStatus.NOT_PROCESSED;

// ***********************
// * Set event listeners *
// ***********************
ui.inputImageFilesInput.addEventListener("change", () => {
  if (ui.inputImageFilesInput.files && ui.inputImageFilesInput.files.length > 0) {
    ui.dropZoneText.textContent = `${ui.inputImageFilesInput.files.length}個のファイルが選択されています。`;
  } else {
    ui.dropZoneText.textContent = 'このエリアにファイルをドラッグ＆ドロップできます';
  }
});

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

ui.dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  e.stopPropagation();
  ui.dropZone.classList.add("dragover");
});

ui.dropZone.addEventListener("dragleave", (e) => {
  e.preventDefault();
  e.stopPropagation();
  ui.dropZone.classList.remove("dragover");
});

ui.dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  e.stopPropagation();
  ui.dropZone.classList.remove("dragover");

  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    // 既存の input 要素にファイルをセット
    ui.inputImageFilesInput.files = files;
    // change イベントを手動で発火させて、テキスト更新などをトリガーする
    const event = new Event('change', { bubbles: true });
    ui.inputImageFilesInput.dispatchEvent(event);
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
  processedImageSets = new Array(config.ecSiteCount).fill([]);
  ui.downloadAllBtn.disabled = true;
  ui.downloadBtns.forEach(btn => btn.disabled = true);
  ui.joinImagesBtn.disabled = true;
  processStatus = ProcessStatus.PROCESSING;

  updateTabDisplay();

  const { inputFiles, ecSiteConfigSet, managementId } = ui.getConfig();
  
  if (inputFiles.length < 3) {
    ui.joinImagesBtn.disabled = false;
    ui.downloadAllBtn.disabled = false;
    ui.downloadBtns.forEach(btn => btn.disabled = false);
    processedImageSets = tmpProcessedImageSets;
    alert("画像は3枚以上選択してください");
    return;
  }

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
  processStatus = ProcessStatus.PROCESSED;
  updateTabDisplay();
});

ui.tabBtns.forEach((tabButton, index) => {
  tabButton.addEventListener("click", () => {
    activeTabIndex = index;
    updateTabDisplay();
  });
});

ui.checkBoxes.forEach((checkbox, index) => {
  checkbox.addEventListener("change", () => {
    ui.tabBtns[index].disabled = !checkbox.checked;
    updateTabDisplay();
  });
});

/**
 * @description タブの表示状態とコンテンツを更新する
 */
function updateTabDisplay() {
  const managementId = ui.getConfig().managementId || '0000xx-00';

  ui.tabBtns.forEach(btn => {
    if (parseInt(btn.dataset.index!) === activeTabIndex) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  switch (processStatus) {
    case ProcessStatus.NOT_PROCESSED:
      ui.tabContentContainer.innerHTML = "ファイルを選択して画像結合を開始してください";
      break;
    case ProcessStatus.PROCESSING:
      ui.tabContentContainer.innerHTML = "画像を結合中です。しばらくお待ちください...";
      break;
    case ProcessStatus.PROCESSED:
      if (processedImageSets[activeTabIndex] && processedImageSets[activeTabIndex].length > 0) {
        ui.displayImageSet(processedImageSets[activeTabIndex], managementId, ui.tabContentContainer);
      }
      else {  
        const conf = ui.getConfig().ecSiteConfigSet[activeTabIndex];
        if (conf && conf.isSelected) {
          ui.tabContentContainer.innerHTML = "画像が結合されていません。";
        } else {
          ui.tabContentContainer.innerHTML = "表示するタブを選択してください。";
        }
      }
      break;
    default:
      ui.tabContentContainer.innerHTML = "不明な状態です。コンソールを確認してください。";
      console.error("Unknown process status:", processStatus);
      break;
    }
}