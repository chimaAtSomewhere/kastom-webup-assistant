export type EcSiteConfig = {
  isSelected: boolean;
  ecSiteName: string;
  limitNumber: number;
  isToResize: boolean;
  imageWidth: number;
  imageHeight: number;
}

export const initEcSiteConfigSet: EcSiteConfig[] = [
  { isSelected: true, ecSiteName: "本店", limitNumber: 50, isToResize: false, imageWidth: 1960, imageHeight: 1280 },
  { isSelected: true, ecSiteName: "デジマート", limitNumber: 11, isToResize: false, imageWidth: 1960, imageHeight: 1280 },
  { isSelected: true, ecSiteName: "ヤフオク", limitNumber: 10, isToResize: false, imageWidth: 1960, imageHeight: 1280 },
  { isSelected: true, ecSiteName: "メルカリ", limitNumber: 20, isToResize: false, imageWidth: 1960, imageHeight: 1280 },
  { isSelected: true, ecSiteName: "Reverb", limitNumber: 25, isToResize: false, imageWidth: 1960, imageHeight: 1280 },
  { isSelected: false, ecSiteName: "shopify", limitNumber: 100, isToResize: false, imageWidth: 1960, imageHeight: 1280 },
  { isSelected: true, ecSiteName: "楽天", limitNumber: 20, isToResize: true, imageWidth: 640, imageHeight: 427 }
]

export const ecSiteCount: number = initEcSiteConfigSet.length;