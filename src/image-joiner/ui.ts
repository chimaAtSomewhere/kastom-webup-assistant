import * as config from './config'

// ***************
// * UI Elements *
// ***************
export const dropZone: HTMLDivElement = document.getElementById("drop-zone") as HTMLDivElement;
export const dropZoneText: HTMLParagraphElement = document.getElementById("drop-zone-text") as HTMLParagraphElement;
export const inputImageFilesInput: HTMLInputElement = document.getElementById("input-image-files") as HTMLInputElement;
export const managementIdInput: HTMLInputElement = document.getElementById("managementId") as HTMLInputElement;
export const controlRowsContainer: HTMLDivElement = document.getElementById('control-rows-container') as HTMLDivElement;
export const joinImagesBtn: HTMLButtonElement = document.getElementById("joining-image") as HTMLButtonElement;
export const downloadContainer: HTMLDivElement = document.getElementById('download-container') as HTMLDivElement;
export const downloadBtns: HTMLButtonElement[] = [];
export const downloadAllBtn: HTMLButtonElement = document.getElementById("download-zip-button-all") as HTMLButtonElement;
export const tabsContainer: HTMLDivElement = document.getElementById("tabs-container") as HTMLDivElement;
export const tabContentContainer: HTMLDivElement = document.getElementById("tab-content-container") as HTMLDivElement;
export const tabBtns: HTMLButtonElement[] = [];
export const checkBoxes: HTMLInputElement[] = [];
export const EcSiteNameInputs: HTMLInputElement[] = [];
export const limitNumberInputs: HTMLInputElement[] = [];
export const imageWidthInputs: HTMLInputElement[] = [];
export const imageHeightInputs: HTMLInputElement[] = [];

// **************
// * Components *
// **************

/**
 * @param {void}
 * @returns {void}
 * @description Initializes the UI by setting up control rows and download buttons.
 */
export function initUI(): void {
  createControlRows();
  createDownloadButtons();
  createTabs();
};

/**
 * @description
 * 各ECサイトのコントロール行を生成
 */
function createControlRows(): void {
  config.initEcSiteConfigSet.forEach((config, row) => {
    const rowElement = createControlRowElement(config);
    controlRowsContainer.appendChild(rowElement);
    
    function createControlRowElement(initialConfig: config.EcSiteConfig): HTMLDivElement {
      const controlRow = document.createElement('div');
      controlRow.className = 'control-row';
      controlRow.style.marginTop = '10px'; 
      
      const checkSelectCheckbox = document.createElement('input');
      checkSelectCheckbox.type = 'checkbox';
      checkSelectCheckbox.id = `ec-site-checkbox-${row}`;
      checkSelectCheckbox.checked = initialConfig.isSelected;
      controlRow.appendChild(checkSelectCheckbox);
      checkBoxes.push(checkSelectCheckbox);

      controlRow.appendChild(
        createAndPushInputGroup('ec-site-name', 'ECサイト:', 'text', initialConfig.ecSiteName, undefined, { maxlength: '50' })
      );
      controlRow.appendChild(
        createAndPushInputGroup('limit-number', '上限枚数:', 'number', String(initialConfig.limitNumber), undefined, { min: '3' })
      );

      const resizeCheckbox = document.createElement('input');
      resizeCheckbox.type = 'checkbox';
      resizeCheckbox.id = `ec-site-resize-${row}`;
      resizeCheckbox.checked = initialConfig.isToResize;
      controlRow.appendChild(resizeCheckbox);
      controlRow.appendChild(document.createTextNode('サイズ変更する: '));

      controlRow.appendChild(
        createAndPushInputGroup('image-width', '横', 'number', String(initialConfig.imageWidth), undefined, { min: '1' })
      );
      controlRow.appendChild(
        createAndPushInputGroup('image-height', '縦', 'number', String(initialConfig.imageHeight), undefined, { min: '1' })
      );

      return controlRow;
    }

    function createAndPushInputGroup(
      groupClass: string,
      labelText: string,
      inputType: string,
      defaultValue: string,
      suffixText?: string,
      inputAttributes?: { [key: string]: string },
    ): HTMLDivElement {
      const div = document.createElement('div');
      div.className = `input ${groupClass}`;
  
      const label = document.createElement('label');
      label.htmlFor = `${groupClass}-${row}`;
      label.textContent = labelText;
      div.appendChild(label);
  
      const input = document.createElement('input');
      input.type = inputType;
      input.id = `${groupClass}-${row}`;
      input.value = defaultValue;
      if (inputAttributes) {
        for (const attr in inputAttributes) {
          input.setAttribute(attr, inputAttributes[attr]);
        }
      }
      div.appendChild(input);
      switch (groupClass) {
        case 'ec-site-name':
          EcSiteNameInputs.push(input);
          break;
        case 'limit-number':
          limitNumberInputs.push(input);
          break;
        case 'image-width':
          imageWidthInputs.push(input);
          break;
        case 'image-height':
          imageHeightInputs.push(input);
          break;
        default:
          break;
      }
      if (suffixText) {
        if (suffixText.trim() === "px") {
          const pxDiv = document.createElement('div');
          pxDiv.className = 'px';
          pxDiv.textContent = 'px';
          div.appendChild(pxDiv);
        } else {
          div.appendChild(document.createTextNode(` ${suffixText}`));
        }
      }
      return div;
    }
  });
}

/**
 * @description
 * ダウンロードボタンを生成
 */
function createDownloadButtons(): void {
  config.initEcSiteConfigSet.forEach((config, index) => {
  const downloadBtn = document.createElement("button");
  downloadBtn.className = "download-zip-button";
  downloadBtn.id = `download-zip-button-${index}`;
  downloadBtn.style.display = "inline-block";
  downloadBtn.textContent = `ダウンロード ${config.ecSiteName}`; 
  downloadBtn.disabled = true; 
  downloadBtns.push(downloadBtn);

  const downloadBtnContainer = document.createElement("div");
  downloadBtnContainer.appendChild(downloadBtn);
  downloadContainer.appendChild(downloadBtnContainer);
});
}

/**
 * @description 現在の選択に基づいてタブを生成または再生成する
 */
function createTabs() {
  const ecSiteConfigs = getConfig().ecSiteConfigSet;
  tabsContainer.innerHTML = "";

  ecSiteConfigs.forEach((config, index) => {
      const tabBtn = document.createElement("button");
      tabBtn.className = "tab-button";
      tabBtn.textContent = config.ecSiteName;
      tabBtn.dataset.index = String(index); 
      tabBtn.disabled = !config.isSelected; 
      if (index === 0) {
        tabBtn.classList.add("active");
      }
      tabsContainer.appendChild(tabBtn);
      tabBtns.push(tabBtn);
  });
}

/**
 * @description 
 * 指定されたコンテナに画像ファイルとそのダウンロードリンクを表示する。
 * @param {File[]} imageFiles
 * @param {string} managementId
 * @param {HTMLElement} container
 */
export function displayImageSet(imageFiles: File[], managementId: string, container: HTMLElement): void {
  container.innerHTML = "";

  imageFiles.forEach((imageFile, index) => {
    const imageUrl = URL.createObjectURL(imageFile);

    const itemContainer = document.createElement("div");
    itemContainer.className = "image-item";

    const imgElement = document.createElement("img");
    imgElement.src = imageUrl;
    itemContainer.appendChild(imgElement);

    const link = document.createElement("a");
    link.href = imageUrl;
    const fileNumber = String(index + 1).padStart(2, '0');
    const extension = imageFile.name.split('.').pop() || 'jpeg';
    link.download = `${managementId}_${fileNumber}.${extension}`;
    link.textContent = `ダウンロード (${link.download})`;
    itemContainer.appendChild(link);

    container.appendChild(itemContainer);

    imgElement.onload = () => { setTimeout(() => {
      URL.revokeObjectURL(imageUrl);
    }, 1000); };
  });
}



/*****************
 * Configuration *
 ******************


/**
 * @description
 * 入力された画像ファイルと管理ID、ECサイトの設定を取得する。
 * @param {void}
 * @returns {Object} 
 */
export function getConfig(): {inputFiles: File[], managementId: string, ecSiteConfigSet: config.EcSiteConfig[]} {
  const inputFiles: File[] = Array.prototype.slice.call(inputImageFilesInput.files || []);
  const fileNameBase: string = managementIdInput.value.trim() || "image";
  const ecSiteConfigSet: config.EcSiteConfig[] = config.initEcSiteConfigSet.map((initialConfig, index) => {
    return {
      isSelected: (document.getElementById(`ec-site-checkbox-${index}`) as HTMLInputElement).checked,
      ecSiteName: EcSiteNameInputs[index].value.trim() || initialConfig.ecSiteName,
      limitNumber: parseInt(limitNumberInputs[index].value) || initialConfig.limitNumber,
      isToResize: (document.getElementById(`ec-site-resize-${index}`) as HTMLInputElement).checked,
      imageWidth: parseInt(imageWidthInputs[index].value) || initialConfig.imageWidth,
      imageHeight: parseInt(imageHeightInputs[index].value) || initialConfig.imageHeight
    };
  });
  return { inputFiles, managementId: fileNameBase, ecSiteConfigSet };
}