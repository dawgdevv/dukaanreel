import { copyFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const source = join(root, "node_modules", "@ffmpeg", "core", "dist", "umd");
const destination = join(root, "public", "ffmpeg");

await mkdir(destination, { recursive: true });
await Promise.all([
  copyFile(join(source, "ffmpeg-core.js"), join(destination, "ffmpeg-core.js")),
  copyFile(join(source, "ffmpeg-core.wasm"), join(destination, "ffmpeg-core.wasm")),
]);
