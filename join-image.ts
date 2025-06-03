import JSZip from "jszip";

/**************
 * Components *
 **************/

const inputImageFilesInput: HTMLInputElement = document.getElementById("input-image-files") as HTMLInputElement;

const fileNameBaseInput: HTMLInputElement = document.getElementById("output-file-name-base") as HTMLInputElement;

const controlRowsContainer = document.getElementById('control-rows-container') as HTMLDivElement;

interface OutputsConfig {
  outputZipFileName: string;
  limitNumber: number;
  imageWidth: number;
  imageHeight: number;
}

const initConfigArr: OutputsConfig[] = [
  { outputZipFileName: "本店", limitNumber: 50, imageWidth: 1960, imageHeight: 1280 },
  { outputZipFileName: "デジマート", limitNumber: 11, imageWidth: 1960, imageHeight: 1280 },
  { outputZipFileName: "ヤフオク", limitNumber: 10, imageWidth: 1960, imageHeight: 1280 },
  { outputZipFileName: "メルカリ", limitNumber: 20, imageWidth: 1960, imageHeight: 1280 },
  { outputZipFileName: "Reverb", limitNumber: 25, imageWidth: 1960, imageHeight: 1280 },
  { outputZipFileName: "shopify", limitNumber: 100, imageWidth: 1960, imageHeight: 1280 },
  { outputZipFileName: "楽天", limitNumber: 20, imageWidth: 640, imageHeight: 427 }
]

const zipFileNameInputArr: HTMLInputElement[] = [];
const limitNumberInputArr: HTMLInputElement[] = [];
const imageWidthInputArr: HTMLInputElement[] = [];
const imageHeightInputArr: HTMLInputElement[] = [];

// control-rows を作成して上で宣言した配列に格納
initConfigArr.forEach((config, row) => {
  const rowElement = createControlRowElement(config);
  controlRowsContainer.appendChild(rowElement);
  
  function createControlRowElement(initialConfig: OutputsConfig): HTMLDivElement {
    const controlRow = document.createElement('div');
    controlRow.className = 'control-row';
    controlRow.style.marginTop = '10px'; 
    
    controlRow.appendChild(
      createAndPushInputGroup('zip-file-name', 'zip-file-name', 'ZIPファイル名:', 'text', initialConfig.outputZipFileName, undefined, { maxlength: '50' })
    );
    controlRow.appendChild(
      createAndPushInputGroup('limit-number', 'limit-number', '上限枚数:', 'number', String(initialConfig.limitNumber), undefined, { min: '3' })
    );
    controlRow.appendChild(
      createAndPushInputGroup('image-width', 'image-width', '画像サイズ(横):', 'number', String(initialConfig.imageWidth), 'px', { min: '1' })
    );
    controlRow.appendChild(
      createAndPushInputGroup('image-height', 'image-height', '画像サイズ(縦):', 'number', String(initialConfig.imageHeight), 'px', { min: '1' })
    );
    return controlRow;
  }

  function createAndPushInputGroup(
    groupClass: string,
    inputIdBase: string,
    labelText: string,
    inputType: string,
    defaultValue: string,
    suffixText?: string,
    inputAttributes?: { [key: string]: string },
  ): HTMLDivElement {
    const div = document.createElement('div');
    div.className = `input ${groupClass}`;

    const label = document.createElement('label');
    label.htmlFor = `${inputIdBase}-${row}`;
    label.textContent = labelText;
    div.appendChild(label);

    const input = document.createElement('input');
    input.type = inputType;
    input.id = `${inputIdBase}-${row}`;
    input.value = defaultValue;
    if (inputAttributes) {
      for (const attr in inputAttributes) {
        input.setAttribute(attr, inputAttributes[attr]);
      }
    }
    div.appendChild(input);
    switch (inputIdBase) {
      case 'zip-file-name':
        zipFileNameInputArr.push(input);
        break;
      case 'limit-number':
        limitNumberInputArr.push(input);
        break;
      case 'image-width':
        imageWidthInputArr.push(input);
        break;
      case 'image-height':
        imageHeightInputArr.push(input);
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

const joinImagesBtn = document.getElementById("joining-image") as HTMLButtonElement;

const downloadContainer = document.getElementById('download-container') as HTMLDivElement;

const downloadBtnArr: HTMLButtonElement[] = [];

// download-button を作成して格納
initConfigArr.forEach((config, index) => {
  const downloadBtn = document.createElement("button");
  downloadBtn.className = "download-zip-button";
  downloadBtn.id = `download-zip-button-${index}`;
  downloadBtn.style.display = "none"; 
  downloadBtn.disabled = true; 
  downloadBtnArr.push(downloadBtn);

  const downloadBtnContainer = document.createElement("div");
  downloadBtnContainer.appendChild(downloadBtn);
  downloadContainer.appendChild(downloadBtnContainer);
});

const garallyContainer = document.getElementById("garally-container") as HTMLDivElement;

/*************
 * Variables *
 *************/

let joinedImageFileArrArr: File[][] = [];

/*******************
 * Event Listeners *
 *******************/

joinImagesBtn.addEventListener("click", onClickJoinImagesBtn);

async function onClickJoinImagesBtn(): Promise<void> {
  const inputImageFileArr: File[] = Array.prototype.slice.call(inputImageFilesInput.files || []);
  if (inputImageFileArr.length < 3) {
    alert("画像は3枚以上選択してください");
    return;
  }
  const outputFileNameBase: string = fileNameBaseInput.value.trim() || "image";
  for (let i = 0; i < initConfigArr.length; i++) {
    const zipFileNameInput = document.getElementById(`zip-file-name-${i}`) as HTMLInputElement;
    const limitNumberInput = document.getElementById(`limit-number-${i}`) as HTMLInputElement;
    const imageWidthInput = document.getElementById(`image-width-${i}`) as HTMLInputElement;
    const imageHeightInput = document.getElementById(`image-height-${i}`) as HTMLInputElement;

    const zipFileName = zipFileNameInput.value;
    const limitNumber = parseInt(limitNumberInput.value);
    const imageWidth = parseInt(imageWidthInput.value);
    const imageHeight = parseInt(imageHeightInput.value);

    await doProcess(inputImageFileArr, limitNumber, imageWidth, imageHeight, outputFileNameBase, zipFileName, i);
  }
}

async function doProcess(inputImageFileArr : File[], limitNumber: number, imageWidth: number, imageHeight: number, outputFileNameBase: string, zipFileName: string, controlRowIndex: number): Promise<void> {
  const firstImageFile: File = inputImageFileArr[0];
  const lastImageFile: File = inputImageFileArr[inputImageFileArr.length - 1];
  const targetImageFileArr: File[] = inputImageFileArr.slice(1, -1);
  const targetImageFilesCount: number = targetImageFileArr.length;

  const netLimitNumber: number = limitNumber - 2;

  if (isNaN(limitNumber) || limitNumber <= 0) {
    alert(`${zipFileName}: 有効な上限枚数を入力してください`);
    return;
  }

  if (targetImageFilesCount < netLimitNumber) {
    const downloadZipBtn: HTMLButtonElement = downloadBtnArr[controlRowIndex];
    downloadZipBtn.style.display = "inline-block";  
    downloadZipBtn.disabled = true;
    downloadZipBtn.textContent = `(${zipFileName}: 画像の結合を行う必要はありません)`;
    return;
  }

  const threshold: number = netLimitNumber * 4;
  if (targetImageFilesCount > threshold) {
    const downloadZipBtn: HTMLButtonElement = downloadBtnArr[controlRowIndex];
    downloadZipBtn.style.display = "inline-block";  
    downloadZipBtn.disabled = true;
    downloadZipBtn.textContent = `(${zipFileName}: 画像の結合を行う必要はありません)`;
    return;
  }

  const [countToJoinFour, countToJoinThree, countToJoinTwo] = calculateCountToJoin(targetImageFileArr.length, netLimitNumber);

  // 後ろの方の画像から 2枚結合，1枚結合，4枚結合の順で行う

  const joinedTwoImages: File[] = [];
  for (let i = 0; i < countToJoinTwo; i++) {
    const twoFilesToJoin: File[] = targetImageFileArr.splice(-2, 2);
    const fourFilesToJoin: File[] = [...twoFilesToJoin, emptyImageFile(), emptyImageFile()];
    const joinedImage: File = await joinImages(fourFilesToJoin, imageWidth, imageHeight);
    joinedTwoImages.push(joinedImage);
  }
  const joinedThreeImages: File[] = [];
  for (let i = 0; i < countToJoinThree; i++) {
    const threeFilesToJoin: File[] = targetImageFileArr.splice(-3, 3);
    const fourFilesToJoin: File[] = [...threeFilesToJoin, emptyImageFile()];
    const joinedImage: File = await joinImages(fourFilesToJoin, imageWidth, imageHeight);
    joinedThreeImages.push(joinedImage);
  }
  const joinedFourImages: File[] = [];
  for (let i = 0; i < countToJoinFour; i++) {
    const fourFilesToJoin: File[] = targetImageFileArr.splice(-4, 4);
    const joinedImage: File = await joinImages(fourFilesToJoin, imageWidth, imageHeight);
    joinedFourImages.push(joinedImage);
  }

  const joinedAllImages: File[] = [
    firstImageFile,
    ...targetImageFileArr,
    ...joinedFourImages.reverse(),
    ...joinedThreeImages.reverse(),
    ...joinedTwoImages.reverse(),
    lastImageFile
  ];

  // displayImages(joinedAllImages, outputFileNameBase);

  joinedImageFileArrArr[controlRowIndex] = joinedAllImages;

  const downloadZipBtn: HTMLButtonElement = downloadBtnArr[controlRowIndex];
  if (joinedAllImages.length > 0) {
    downloadZipBtn.style.display = "inline-block";  
    downloadZipBtn.disabled = false;
    downloadZipBtn.textContent = `ダウンロード(${zipFileName}.zip)`;
  } else {
    downloadZipBtn.style.display = "none";
  }
}

function calculateCountToJoin(fileCounts: number, limitNumber: number): [number, number, number] {
  const overLimitCount: number = fileCounts - limitNumber;

  // 4枚を結合すると3枚減る．超過枚数を3で割って、4枚結合する回数を求める
  const temporaryCountToJoinFour: number = Math.floor(overLimitCount / 3);
  const surplusCount: number = overLimitCount % 3;

  let countToJoinFour: number, countToJoinThree: number, countToJoinTwo: number;

  switch (surplusCount) {
    case 0:
      countToJoinFour = temporaryCountToJoinFour;
      countToJoinThree = 0;
      countToJoinTwo = 0;
      break;
    // 2枚結合を1回行う
    // 4枚結合が1個以上あるなら，そこから1枚持ってきて，3枚結合を2回行う
    case 1:
      if (temporaryCountToJoinFour > 0) {
        countToJoinFour = temporaryCountToJoinFour - 1;
        countToJoinThree = 2;
        countToJoinTwo = 0;
      } else {
        countToJoinFour = 0;
        countToJoinThree = 0;
        countToJoinTwo = 1;
      }
      break;
    // 3枚結合を1回行う
    case 2:
      countToJoinFour = temporaryCountToJoinFour;
      countToJoinThree = 1;
      countToJoinTwo = 0;
      break;
    default:
      throw new Error("unexpected surplus count");
  }

  return [countToJoinFour, countToJoinThree, countToJoinTwo];
}

async function joinImages(imageFiles: File[], width: number, height: number): Promise<File> {
  const loadedImages: HTMLImageElement[] = await Promise.all(imageFiles.map(file => loadImage(file)));
  
  const canvas: HTMLCanvasElement = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx: CanvasRenderingContext2D = canvas.getContext("2d")!;
  const gridCols: number = 2;
  const gridRows: number = 2;
  const cellWidth: number = canvas.width / gridCols;
  const cellHeight: number = canvas.height / gridRows;

  loadedImages.forEach((img, index) => {
    const x = (index % gridCols) * cellWidth;
    const y = Math.floor(index / gridCols) * cellHeight;
    ctx.drawImage(img, x, y, cellWidth, cellHeight);
  });
  
  // Canvas の内容を Data URL に変換し、新しい File を作成
  const mergedImageUrl: string = canvas.toDataURL("image/png");
  const mergedImageFile: File = dataURLToFile(mergedImageUrl, "merged.png");
  return mergedImageFile;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function dataURLToFile(dataurl: string, filename: string): File {
  const splittedUrlArr: string[] = dataurl.split(',');
  const mimeMatch: RegExpMatchArray | null = splittedUrlArr[0].match(/:(.*?);/);
  const mime: string = mimeMatch ? mimeMatch[1] : "";
  const bStr: string = atob(splittedUrlArr[1]);
  let n: number = bStr.length;
  const u8Arr: Uint8Array<ArrayBuffer> = new Uint8Array(n);
  while(n--){
    u8Arr[n] = bStr.charCodeAt(n);
  }
  return new File([u8Arr], filename, { type: mime });
}

function displayImages(imageFiles: File[], fileNamePrefix: string): void {
  garallyContainer.innerHTML = "";

  imageFiles.forEach((imageFile, index) => {
    const imgElement = document.createElement("img");
    imgElement.src = URL.createObjectURL(imageFile);
    imgElement.width = 200;
    imgElement.height = 150;
    garallyContainer.appendChild(imgElement);

    const link = document.createElement("a");
    link.href = URL.createObjectURL(imageFile);
    link.download = `${fileNamePrefix}_${index + 1}.png`;
    link.textContent = `ダウンロード ${fileNamePrefix}_${index + 1}`;
    garallyContainer.appendChild(link);
    garallyContainer.appendChild(document.createElement("br"));
  });
}

function emptyImageFile(): File {
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 600;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#FFFFFF"; // 白色で塗りつぶす
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  const dataUrl = canvas.toDataURL("image/png");
  return dataURLToFile(dataUrl, "empty.png");
}

downloadBtnArr.forEach((downloadZipBtn, index) => {
  downloadZipBtn.addEventListener("click", async () => {
    if (joinedImageFileArrArr[index].length > 0) {
      downloadZipBtn.disabled = true;
      downloadZipBtn.textContent = "ZIPファイル作成中...";

      const zipFileName = zipFileNameInputArr[index].value.trim() || initConfigArr[index].outputZipFileName;
      const outputFileNameBase = fileNameBaseInput.value.trim() || "image";

      await createAndDownloadZip(joinedImageFileArrArr[index], outputFileNameBase, zipFileName);

      downloadZipBtn.disabled = false; 
      downloadZipBtn.textContent = `ダウンロード(${zipFileName}.zip)`; 
    } else {
      alert("ダウンロードするファイルがありません。まず画像を結合してください。");
    }
    downloadContainer.appendChild(downloadZipBtn);
  });
})

async function createAndDownloadZip(imageFiles: File[], outputFileNameBase: string, zipFileName: string): Promise<void> {
  const zip = new JSZip();

  imageFiles.forEach((file, index) => {
    const filenameInZip = `${outputFileNameBase}_${(index < 10 ? '0' : '') + (index + 1)}.${file.name.split('.').pop() || 'png'}`;
    zip.file(filenameInZip, file);
  });

  try {
    const zipContent: Blob = await zip.generateAsync({ type: "blob" });

    if (!zipContent || zipContent.size === 0) {
      alert("ZIPファイルの生成に失敗しました。コンテンツが空です。");
      return;
    }

    const link = document.createElement("a");
    link.href = URL.createObjectURL(zipContent);

    link.download = `${zipFileName}_${outputFileNameBase}.zip`;
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