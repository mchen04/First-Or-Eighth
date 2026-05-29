import { readFileSync } from "node:fs";

// Validates an image file's format signature and pixel dimensions against a
// contract. `fail` only records a message (it does not abort), so every helper
// here bails defensively on malformed input rather than reading past the buffer.

export function assertImageContract(file, contract, label, fail) {
  let body;
  try {
    body = readFileSync(file);
  } catch {
    fail(`${label} could not be read: ${file}`);
    return;
  }

  if (!checkFormat(body, contract.format, label, file, fail)) return;

  const size = imageSize(body, file, fail);
  if (!size) return;

  if (size.width !== contract.width || size.height !== contract.height) {
    fail(`${label} has ${size.width}x${size.height}; expected ${contract.width}x${contract.height}: ${file}`);
  }
}

function checkFormat(body, format, label, file, fail) {
  if (format === "png") {
    if (body.length < 24) return reject(fail, `${label} is a truncated PNG: ${file}`);
    if (body.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") return reject(fail, `${label} is not a PNG image: ${file}`);
    if (body.readUInt32BE(8) !== 13 || body.subarray(12, 16).toString("ascii") !== "IHDR") {
      return reject(fail, `${label} has invalid PNG IHDR metadata: ${file}`);
    }
    return true;
  }

  if (format === "webp") {
    if (body.length < 12) return reject(fail, `${label} is a truncated WebP: ${file}`);
    if (body.subarray(0, 4).toString("ascii") !== "RIFF" || body.subarray(8, 12).toString("ascii") !== "WEBP") {
      return reject(fail, `${label} is not a WebP image: ${file}`);
    }
    return true;
  }

  return reject(fail, `Unsupported image format contract for ${label}: ${format}`);
}

function imageSize(body, file, fail) {
  if (file.endsWith(".png")) {
    if (body.length < 24) {
      fail(`Truncated PNG IHDR: ${file}`);
      return undefined;
    }
    return { width: body.readUInt32BE(16), height: body.readUInt32BE(20) };
  }

  if (file.endsWith(".webp")) return webpSize(body, file, fail);

  fail(`Unsupported image format for size check: ${file}`);
  return undefined;
}

function webpSize(body, file, fail) {
  let offset = 12;

  while (offset + 8 <= body.length) {
    const chunk = body.subarray(offset, offset + 4).toString("ascii");
    const size = body.readUInt32LE(offset + 4);
    const data = offset + 8;
    if (data + size > body.length) {
      fail(`Truncated WebP ${chunk} chunk payload: ${file}`);
      return undefined;
    }

    if (chunk === "VP8X") {
      if (size < 10) break;
      return { width: body.readUIntLE(data + 4, 3) + 1, height: body.readUIntLE(data + 7, 3) + 1 };
    }
    if (chunk === "VP8 ") {
      if (size < 10) break;
      return { width: body.readUInt16LE(data + 6) & 0x3fff, height: body.readUInt16LE(data + 8) & 0x3fff };
    }
    if (chunk === "VP8L") {
      if (size < 5) break;
      const bits = body.readUInt32LE(data + 1);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }

    offset = data + size + (size % 2);
  }

  fail(`Unsupported or truncated WebP: no readable image-size chunk: ${file}`);
  return undefined;
}

function reject(fail, message) {
  fail(message);
  return false;
}
