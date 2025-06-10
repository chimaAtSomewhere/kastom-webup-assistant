/**
 * @description 
 * 真っ白な画像ファイルを生成する．
 * サイズは適当でいいと思っているので 800x600 px で固定している．
 * @returns {File} 
 */
export function getEmptyImageFile(): File {
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 600;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#FFFFFF"; // 白色で塗りつぶす
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  const dataUrl = canvas.toDataURL("image/jpeg", 1.0);
  return urlToFile(dataUrl, "empty.jpeg");
}

/**
 * @description 
 * 生成 AI に書かせたので仕様を知らない．
 * @param {string} url
 * @param {string} fileName
 * @returns {File}
 */
export function urlToFile(url: string, fileName: string): File {
  const splittedUrlArr: string[] = url.split(',');
  const mimeMatch: RegExpMatchArray | null = splittedUrlArr[0].match(/:(.*?);/);
  const mime: string = mimeMatch ? mimeMatch[1] : "";
  const bStr: string = atob(splittedUrlArr[1]);
  let n: number = bStr.length;
  const u8Arr: Uint8Array<ArrayBuffer> = new Uint8Array(n);
  while(n--){
    u8Arr[n] = bStr.charCodeAt(n);
  }
  return new File([u8Arr], fileName, { type: mime });
}

/**
 * @description 
 * 画像をロードする感じ．生成 AI に書かせたので仕様を知らない．
 * @param {File} file
 * @returns {Promise<HTMLImageElement>}
 */
export function imageFileToImageElement(file: File): Promise<HTMLImageElement> {
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

/**
 * @description 
 * 生成 AI に書かせたので仕様を知らない．
 * @param {File} file
 * @param {number} width
 * @param {number} height
 * @returns {Promise<File>}
 */
export async function resizeImage(file: File, width: number, height: number): Promise<File> {
  const img = await imageFileToImageElement(file); // 既存の関数を再利用

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(new File([blob], file.name, { type: file.type }));
      } else {
        reject(new Error("Canvas to Blob conversion failed"));
      }
    }, file.type, 1.0);
  });
}

/**
 * @description 
 * 画像枚数が平方数の場合，グリッド状に配置して結合して指定サイズの新しい画像を作る．
 * @param {File[]} image 
 * @param {number} width 
 * @param {number} height 
 * @returns {Promise<File>}
 */
export async function joinImages(image: File[], width: number, height: number): Promise<File> {
  // imageFiles の枚数が平方数でない場合エラーを吐く
  const sqrtOfCount: number = Math.sqrt(image.length);
  const isCountSquare: boolean = Number.isInteger(sqrtOfCount);
  if (!isCountSquare) {
    throw new Error("画像ファイルの枚数は平方数でなければなりません。");
  }

  // 結合する
  const loadedImages: HTMLImageElement[] = await Promise.all(image.map(file => imageFileToImageElement(file)));
  
  const canvas: HTMLCanvasElement = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx: CanvasRenderingContext2D = canvas.getContext("2d")!;
  const gridCols: number = sqrtOfCount;
  const gridRows: number = sqrtOfCount;
  const cellWidth: number = canvas.width / gridCols;
  const cellHeight: number = canvas.height / gridRows;

  loadedImages.forEach((img, index) => {
    const x = (index % gridCols) * cellWidth;
    const y = Math.floor(index / gridCols) * cellHeight;
    ctx.drawImage(img, x, y, cellWidth, cellHeight);
  });
  
  const mergedImageUrl: string = canvas.toDataURL("image/jpeg", 1.0);
  const mergedImageFile: File = urlToFile(mergedImageUrl, "merged.jpeg");
  return mergedImageFile;
}

/**
 * @description 
 * 画像枚数が limitNumber を超えた場合に，結合する回数を計算する．
 * 4枚結合ができる場合は 4 枚結合を優先して行う．
 * 3枚結合と2枚結合は、4枚結合ができない場合に行う．
 * 見た目が自然になるので，2枚結合 + 4枚結合 は 3枚結合 * 2 にする．
 * @param {number} imageCount 
 * @param {number} limitNumber 
 * @return {{ countToJoinFour: number, countToJoinThree: number, countToJoinTwo: number }}
 */
export function calculateJoiningStrategy(imageCount: number, limitNumber: number): { countToJoinFour: number, countToJoinThree: number, countToJoinTwo: number } {
  const overLimitCount: number = imageCount - limitNumber;

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

  return { countToJoinFour, countToJoinThree, countToJoinTwo };
}

/**
 * @description
 * 画像ファイルを結合して，指定された枚数に収まるように処理する．
 * 先頭と末尾の画像は結合せずそのままにする．
 * @param {File[]} images 
 * @param {number} limitNumber 
 * @param {number} imageWidth 
 * @param {number} imageHeight 
 * @returns {Promise<File[]>}
 */
export async function generateImageSet(images: File[], limitNumber: number, imageWidth: number, imageHeight: number): Promise<File[]> {
  const firstImageFile: File = images[0];
  const lastImageFile: File = images[images.length - 1];
  const targetImageFileArr: File[] = images.slice(1, -1);
  const targetImageFilesCount: number = targetImageFileArr.length;

  const netLimitNumber: number = limitNumber - 2;

  const {countToJoinFour, countToJoinThree, countToJoinTwo} = calculateJoiningStrategy(targetImageFileArr.length, netLimitNumber);

  // 後ろの方の画像から 2枚結合，1枚結合，4枚結合の順で行う

  const joinedTwoImages: File[] = [];
  for (let i = 0; i < countToJoinTwo; i++) {
    const twoFilesToJoin: File[] = targetImageFileArr.splice(-2, 2);
    const fourFilesToJoin: File[] = [...twoFilesToJoin, getEmptyImageFile(), getEmptyImageFile()];
    const joinedImage: File = await joinImages(fourFilesToJoin, imageWidth, imageHeight);
    joinedTwoImages.push(joinedImage);
  }
  const joinedThreeImages: File[] = [];
  for (let i = 0; i < countToJoinThree; i++) {
    const threeFilesToJoin: File[] = targetImageFileArr.splice(-3, 3);
    const fourFilesToJoin: File[] = [...threeFilesToJoin, getEmptyImageFile()];
    const joinedImage: File = await joinImages(fourFilesToJoin, imageWidth, imageHeight);
    joinedThreeImages.push(joinedImage);
  }
  const joinedFourImages: File[] = [];
  for (let i = 0; i < countToJoinFour; i++) {
    const fourFilesToJoin: File[] = targetImageFileArr.splice(-4, 4);
    const joinedImage: File = await joinImages(fourFilesToJoin, imageWidth, imageHeight);
    joinedFourImages.push(joinedImage);
  }

  const resizedFirstImageFile: File = await resizeImage(firstImageFile, imageWidth, imageHeight);
  const resizedTargetImageFileArr: File[] = await Promise.all(targetImageFileArr.map(file => resizeImage(file, imageWidth, imageHeight)));
  const resizedLastImageFile: File = await resizeImage(lastImageFile, imageWidth, imageHeight);

  const joinedAllImages: File[] = [
    resizedFirstImageFile,
    ...resizedTargetImageFileArr,
    ...joinedFourImages.reverse(),
    ...joinedThreeImages.reverse(),
    ...joinedTwoImages.reverse(),
    resizedLastImageFile
  ];

  return joinedAllImages;
}