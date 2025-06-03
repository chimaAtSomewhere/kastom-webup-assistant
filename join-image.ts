import JSZip from "jszip";

const uploadInput = document.getElementById("files") as HTMLInputElement;
const limitNumberInput = document.getElementById("limitNumber") as HTMLInputElement;
const fileNamePrefixInput = document.getElementById("fileNamePrefix") as HTMLInputElement;
const joinImagesBtn = document.getElementById("joinImages") as HTMLButtonElement;
const garallyContainer = document.getElementById("garally") as HTMLDivElement;
const downloadZipBtn = document.getElementById("downloadZipBtn") as HTMLButtonElement;

let filesToZip: File[] = [];
let currentFileNamePrefixForZip: string = "";

joinImagesBtn.addEventListener("click", onClickJoinImagesBtn);

async function onClickJoinImagesBtn(): Promise<void> {
  const inputImageFileArr : File[] = Array.prototype.slice.call(uploadInput.files || []);
  const firstImageFile: File = inputImageFileArr[0];
  const lastImageFile: File = inputImageFileArr[inputImageFileArr.length - 1];
  const targetImageFileArr: File[] = inputImageFileArr.slice(1, -1);
  const targetImageFilesCount: number = targetImageFileArr.length;

  const limitNumber: number = parseInt(limitNumberInput.value);
  const netLimitNumber: number = limitNumber - 2;

  if (inputImageFileArr.length < 3) {
    alert("画像は3枚以上選択してください");
    return;
  }

  if (isNaN(limitNumber) || limitNumber <= 0) {
    alert("有効な上限枚数を入力してください");
    return;
  }

  if (targetImageFilesCount < netLimitNumber) {
    alert("結合不要: 画像数が上限を下回っています");
    return;
  }

  const threshold: number = netLimitNumber * 4;
  if (targetImageFilesCount > threshold) {
    alert("不可能: 画像の結合を行っても上限を満たせません");
    return;
  }

  const [countToJoinFour, countToJoinThree, countToJoinTwo] = calculateCountToJoin(targetImageFileArr.length, netLimitNumber);

  // 後ろの方の画像から 2枚結合，1枚結合，4枚結合の順で行う

  const joinedTwoImages: File[] = [];
  for (let i = 0; i < countToJoinTwo; i++) {
    const twoFilesToJoin: File[] = targetImageFileArr.splice(-2, 2);
    const fourFilesToJoin: File[] = [...twoFilesToJoin, emptyImageFile(), emptyImageFile()];
    const joinedImage: File = await joinImages(fourFilesToJoin);
    joinedTwoImages.push(joinedImage);
  }
  const joinedThreeImages: File[] = [];
  for (let i = 0; i < countToJoinThree; i++) {
    const threeFilesToJoin: File[] = targetImageFileArr.splice(-3, 3);
    const fourFilesToJoin: File[] = [...threeFilesToJoin, emptyImageFile()];
    const joinedImage: File = await joinImages(fourFilesToJoin);
    joinedThreeImages.push(joinedImage);
  }
  const joinedFourImages: File[] = [];
  for (let i = 0; i < countToJoinFour; i++) {
    const fourFilesToJoin: File[] = targetImageFileArr.splice(-4, 4);
    const joinedImage: File = await joinImages(fourFilesToJoin);
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

  const fileNamePrefix: string = fileNamePrefixInput.value || "joined_image";
  displayImages(joinedAllImages, fileNamePrefix);

  if (joinedAllImages.length > 0) {
    filesToZip = joinedAllImages; 
    currentFileNamePrefixForZip = fileNamePrefix; 
    downloadZipBtn.style.display = "inline-block";  
    downloadZipBtn.disabled = false;
  } else {
    downloadZipBtn.style.display = "none"; 
    filesToZip = []; 
    currentFileNamePrefixForZip = ""; 
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

async function joinImages(imageFiles: File[]): Promise<File> {
  const loadedImages: HTMLImageElement[] = await Promise.all(imageFiles.map(file => loadImage(file)));
  
  const canvas: HTMLCanvasElement = document.createElement("canvas");
  canvas.width = 1960;
  canvas.height = 1280;
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
    link.download = `${fileNamePrefix}${index + 1}.png`;
    link.textContent = `ダウンロード ${fileNamePrefix}${index + 1}`;
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

async function createAndDownloadZip(imageFiles: File[], fileNamePrefix: string): Promise<void> {
  const zip = new JSZip();

  imageFiles.forEach((file, index) => {
    const filenameInZip = `${fileNamePrefix}${index + 1}.${file.name.split('.').pop() || 'png'}`;
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

    link.download = `${fileNamePrefix}all_images.zip`;
    document.body.appendChild(link);

    link.click();

    setTimeout(() => {
      URL.revokeObjectURL(link.href);
      document.body.removeChild(link);
    }, 1000); // 1000ミリ秒待つ (この時間は調整が必要な場合があります)

  } catch (error) {
    console.error("ZIPファイルの生成またはダウンロード処理中にエラーが発生しました:", error); // より詳細なエラー箇所を特定しやすくする
    alert("ZIPファイルの生成またはダウンロードに失敗しました。コンソールを確認してください。");
  }
}

downloadZipBtn.addEventListener("click", async () => {
  if (filesToZip.length > 0) {
    downloadZipBtn.disabled = true;
    downloadZipBtn.textContent = "ZIPファイル作成中...";

    await createAndDownloadZip(filesToZip, currentFileNamePrefixForZip);

    downloadZipBtn.disabled = false; 
    downloadZipBtn.textContent = "結合画像をZIPでダウンロード"; 
  } else {
    alert("ダウンロードするファイルがありません。まず画像を結合してください。");
  }
});