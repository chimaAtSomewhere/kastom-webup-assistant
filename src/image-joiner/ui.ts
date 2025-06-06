import * as config from './config'

// ***************
// * UI Elements *
// ***************
export const inputImageFilesInput: HTMLInputElement = document.getElementById("input-image-files") as HTMLInputElement;
export const managementIdInput: HTMLInputElement = document.getElementById("managementId") as HTMLInputElement;
export const controlRowsContainer: HTMLDivElement = document.getElementById('control-rows-container') as HTMLDivElement;
export const joinImagesBtn: HTMLButtonElement = document.getElementById("joining-image") as HTMLButtonElement;
export const downloadContainer: HTMLDivElement = document.getElementById('download-container') as HTMLDivElement;
export const downloadBtns: HTMLButtonElement[] = [];
export const galleryContainer: HTMLDivElement = document.getElementById("gallery-container") as HTMLDivElement;
export const EcSiteNameInputs: HTMLInputElement[] = [];
export const limitNumberInputs: HTMLInputElement[] = [];
export const imageWidthInputs: HTMLInputElement[] = [];
export const imageHeightInputs: HTMLInputElement[] = [];

// *********************
// * UI Initialization *
// *********************

/**
 * @param {void}
 * @returns {void}
 * @description Initializes the UI by setting up control rows and download buttons.
 */
export function initUI(): void {
  initControlRows();
  initDownloadButtons();
};

function initControlRows(): void {
  config.initEcSiteConfigSet.forEach((config, row) => {
    const rowElement = createControlRowElement(config);
    controlRowsContainer.appendChild(rowElement);
    
    function createControlRowElement(initialConfig: config.EcSiteConfig): HTMLDivElement {
      const controlRow = document.createElement('div');
      controlRow.className = 'control-row';
      controlRow.style.marginTop = '10px'; 
      
      controlRow.appendChild(
        createAndPushInputGroup('ec-site-name', 'ECサイト:', 'text', initialConfig.ecSiteName, undefined, { maxlength: '50' })
      );
      controlRow.appendChild(
        createAndPushInputGroup('limit-number', '上限枚数:', 'number', String(initialConfig.limitNumber), undefined, { min: '3' })
      );
      controlRow.appendChild(
        createAndPushInputGroup('image-width', '画像サイズ(横):', 'number', String(initialConfig.imageWidth), 'px', { min: '1' })
      );
      controlRow.appendChild(
        createAndPushInputGroup('image-height', '画像サイズ(縦):', 'number', String(initialConfig.imageHeight), 'px', { min: '1' })
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

function initDownloadButtons(): void {
  config.initEcSiteConfigSet.forEach((config, index) => {
  const downloadBtn = document.createElement("button");
  downloadBtn.className = "download-zip-button";
  downloadBtn.id = `download-zip-button-${index}`;
  downloadBtn.style.display = "none"; 
  downloadBtn.disabled = true; 
  downloadBtns.push(downloadBtn);

  const downloadBtnContainer = document.createElement("div");
  downloadBtnContainer.appendChild(downloadBtn);
  downloadContainer.appendChild(downloadBtnContainer);
});
}

export function getConfig(): {inputFiles: File[], fileNameBase: string, ecSiteConfigSet: config.EcSiteConfig[]} {
  const inputFiles: File[] = Array.prototype.slice.call(inputImageFilesInput.files || []);
  const fileNameBase: string = managementIdInput.value.trim() || "image";
  const ecSiteConfigSet: config.EcSiteConfig[] = config.initEcSiteConfigSet.map((initialConfig, index) => {
    return {
      ecSiteName: EcSiteNameInputs[index].value.trim() || initialConfig.ecSiteName,
      limitNumber: parseInt(limitNumberInputs[index].value) || initialConfig.limitNumber,
      imageWidth: parseInt(imageWidthInputs[index].value) || initialConfig.imageWidth,
      imageHeight: parseInt(imageHeightInputs[index].value) || initialConfig.imageHeight
    };
  });
  return { inputFiles, fileNameBase, ecSiteConfigSet };
}