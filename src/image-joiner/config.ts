export type EcSiteConfig = {
  ecSiteName: string;
  limitNumber: number;
  imageWidth: number;
  imageHeight: number;
}

export const initEcSiteConfigSet: EcSiteConfig[] = [
  { ecSiteName: "本店", limitNumber: 50, imageWidth: 1960, imageHeight: 1280 },
  { ecSiteName: "デジマート", limitNumber: 11, imageWidth: 1960, imageHeight: 1280 },
  { ecSiteName: "ヤフオク", limitNumber: 10, imageWidth: 1960, imageHeight: 1280 },
  { ecSiteName: "メルカリ", limitNumber: 20, imageWidth: 1960, imageHeight: 1280 },
  { ecSiteName: "Reverb", limitNumber: 25, imageWidth: 1960, imageHeight: 1280 },
  { ecSiteName: "shopify", limitNumber: 100, imageWidth: 1960, imageHeight: 1280 },
  { ecSiteName: "楽天", limitNumber: 20, imageWidth: 640, imageHeight: 427 }
]

export const ecSiteCount: number = initEcSiteConfigSet.length;