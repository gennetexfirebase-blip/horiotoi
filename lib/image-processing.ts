import "server-only";
import sharp from "sharp";

export async function optimizePostImage(file: File) {
  const source = Buffer.from(await file.arrayBuffer());
  const image = sharp(source, { animated: file.type === "image/gif", limitInputPixels: 80_000_000 }).rotate();
  const metadata = await image.metadata();
  if (!metadata.width || !metadata.height) throw new Error("Зургийн хэмжээ уншигдсангүй");
  const buffer = await image
    .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 92, alphaQuality: 95, smartSubsample: true, effort: 4 })
    .toBuffer();
  return { buffer, contentType: "image/webp", extension: "webp", width: metadata.width, height: metadata.height };
}
