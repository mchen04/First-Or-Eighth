import { readFileSync } from "node:fs";

export function assertImageContract(file, contract, label, fail) {
  const body = readFileSync(file);
  assertImageFormat(body, contract.format, label, file, fail);
  const { width, height } = imageSize(body, file, fail);

  if (width !== contract.width || height !== contract.height) {
    fail(`${label} has ${width}x${height}; expected ${contract.width}x${contract.height}: ${file}`);
  }
}

function assertImageFormat(body, format, label, file, fail) {
  if (format === "png") {
    const signature = body.subarray(0, 8).toString("hex");
    if (signature !== "89504e470d0a1a0a") fail(`${label} is not a PNG image: ${file}`);
    return;
  }

  if (format === "webp") {
    const riff = body.subarray(0, 4).toString("ascii");
    const webp = body.subarray(8, 12).toString("ascii");
    if (riff !== "RIFF" || webp !== "WEBP") fail(`${label} is not a WebP image: ${file}`);
    return;
  }

  fail(`Unsupported image format contract for ${label}: ${format}`);
}

function imageSize(body, file, fail) {
  if (file.endsWith(".png")) {
    return {
      width: body.readUInt32BE(16),
      height: body.readUInt32BE(20)
    };
  }

  if (file.endsWith(".webp")) {
    const chunk = body.subarray(12, 16).toString("ascii");
    if (chunk === "VP8X") {
      return {
        width: body.readUIntLE(24, 3) + 1,
        height: body.readUIntLE(27, 3) + 1
      };
    }
    if (chunk === "VP8 ") {
      return {
        width: body.readUInt16LE(26) & 0x3fff,
        height: body.readUInt16LE(28) & 0x3fff
      };
    }
  }

  fail(`Unsupported image format for size check: ${file}`);
}
