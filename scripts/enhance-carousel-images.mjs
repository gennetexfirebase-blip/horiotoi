import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
import sharp from "sharp";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
loadEnvConfig(process.cwd());
const index = JSON.parse(await readFile(path.join(process.cwd(), "data", "index.json"), "utf8"));
const output = path.join(process.cwd(), "public", "carousel"); await mkdir(output, { recursive: true });
for (const article of index.slice(0, 4)) {
  if (!article.image) continue;
  const response = await fetch(article.image, { signal: AbortSignal.timeout(60000), headers: { "user-agent": "Mozilla/5.0" } });
  if (!response.ok) throw new Error(`${article.id}: HTTP ${response.status}`);
  const source = Buffer.from(await response.arrayBuffer());
  const optimized = await sharp(source).rotate().resize({ width: 1600, height: 1000, fit: "cover", position: "attention", kernel: sharp.kernel.lanczos3 }).modulate({ saturation: 1.18, brightness: 1.02 }).sharpen({ sigma: 1.15, m1: 1, m2: 2 }).webp({ quality: 94, smartSubsample: true, effort: 5 }).toBuffer();
  await writeFile(path.join(output, `${article.id}.webp`), optimized);
  article.image = `/carousel/${article.id}.webp`;
  console.log(`${article.id}: ${(optimized.length / 1024).toFixed(0)} KB`);
}
await writeFile(path.join(process.cwd(), "data", "index.json"), `${JSON.stringify(index, null, 2)}\n`);

