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
    return webpSize(body, fail);
  }

  fail(`Unsupported image format for size check: ${file}`);
}

function webpSize(body, fail) {
  let offset = 12;
  while (offset + 8 <= body.length) {
    const chunk = body.subarray(offset, offset + 4).toString("ascii");
    const size = body.readUInt32LE(offset + 4);
    const data = offset + 8;

    if (chunk === "VP8X") {
      requireBytes(size, 10, "VP8X", fail);
      return {
        width: body.readUIntLE(data + 4, 3) + 1,
        height: body.readUIntLE(data + 7, 3) + 1
      };
    }
    if (chunk === "VP8 ") {
      requireBytes(size, 10, "VP8", fail);
      return {
        width: body.readUInt16LE(data + 6) & 0x3fff,
        height: body.readUInt16LE(data + 8) & 0x3fff
      };
    }
    if (chunk === "VP8L") {
      requireBytes(size, 5, "VP8L", fail);
      const bits = body.readUInt32LE(data + 1);
      return {
        width: (bits & 0x3fff) + 1,
        height: ((bits >> 14) & 0x3fff) + 1
      };
    }

    offset = data + size + (size % 2);
  }

  fail("Unsupported WebP: no image-size chunk found");
}

function requireBytes(actual, minimum, chunk, fail) {
  if (actual < minimum) fail(`Truncated WebP ${chunk} chunk: expected at least ${minimum} bytes, found ${actual}`);
}
