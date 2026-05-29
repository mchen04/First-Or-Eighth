// A small, dependency-free YAML parser covering the subset this project's data
// files use: block mappings, block sequences (including the compact "- key:"
// form), inline flow sequences ([a, b]), single/double quoted and plain
// scalars, folded (>) and literal (|) block scalars, whole-line comments, and
// blank lines. It runs unchanged in the browser and in Node, so the YAML files
// are the single canonical data source with no build step and no drift.
//
// It is intentionally not a full YAML 1.2 implementation, but it follows YAML's
// rules where it matters:
//   * A "#" that begins a line is a comment; a "#" after a space in a plain
//     value is rejected (a literal "#" must be quoted, e.g. bio: "Autist #3.").
//     Trailing comments are allowed after quoted/flow/block-header values.
//   * A mapping line that is not "key: value" (e.g. a missing space after the
//     colon), or a line indented out of alignment, throws a clear error instead
//     of silently dropping fields.
// Inputs are validated downstream in lib/data.mjs, so malformed data surfaces
// as clear errors.

export class YamlError extends Error {
  constructor(message, line) {
    super(line == null ? message : `${message} (line ${line + 1})`);
    this.name = "YamlError";
  }
}

export function parseYaml(text) {
  const lines = String(text).replace(/^﻿/, "").replace(/\r\n?/g, "\n").split("\n");
  const ctx = { lines, i: 0 };
  // Skip a leading document marker if present; everything else is content.
  skipBlankLines(ctx);
  if (ctx.i < ctx.lines.length && ctx.lines[ctx.i].trim() === "---") ctx.i++;
  const value = parseNode(ctx, 0);
  return value === undefined ? null : value;
}

function parseNode(ctx, indent) {
  skipBlankLines(ctx);
  if (ctx.i >= ctx.lines.length) return null;

  const line = ctx.lines[ctx.i];
  const ind = indentOf(line, ctx.i);
  if (ind < indent) return null;

  const content = line.slice(ind);
  if (isSequenceMarker(content)) return parseSequence(ctx, ind);
  if (findKeyColon(content) !== -1) return parseMapping(ctx, ind);

  // A lone "key:value" (missing the space) reaches here as a "scalar"; catch it
  // so a malformed first/only field fails loudly like a sibling field would.
  if (looksLikeMalformedKey(content.trim())) {
    throw new YamlError(`Expected "key: value" — is a space missing after ":"? Got: ${content.trim()}`, ctx.i);
  }

  ctx.i++;
  return parseScalar(content.trim(), ctx.i - 1);
}

function parseMapping(ctx, indent) {
  const map = {};

  for (;;) {
    skipBlankLines(ctx);
    if (ctx.i >= ctx.lines.length) break;

    const line = ctx.lines[ctx.i];
    const ind = indentOf(line, ctx.i);
    if (ind < indent) break;
    // A line indented deeper than the mapping that was not consumed by a block
    // value is orphaned — fail loudly instead of silently dropping it and every
    // field after it.
    if (ind > indent) throw new YamlError(`Unexpected indentation — this line does not align with its block (for a multi-line value, start it with "> " or "| " after the colon): ${line.trim()}`, ctx.i);

    const content = line.slice(ind);
    const colon = findKeyColon(content);
    if (colon === -1) {
      // A line at the mapping's own indent that is not a key is malformed —
      // most often a missing space after the colon (e.g. "url:https://..."),
      // which would otherwise silently drop this field and every field after.
      if (isSequenceMarker(content)) break;
      throw new YamlError(`Expected "key: value" — is a space missing after ":"? Got: ${content}`, ctx.i);
    }

    const key = parseKey(content.slice(0, colon), ctx.i);
    if (Object.prototype.hasOwnProperty.call(map, key)) {
      throw new YamlError(`Duplicate key "${key}" in this block (did you forget to rename a copied entry?)`, ctx.i);
    }
    const rest = content.slice(colon + 1).trim();
    ctx.i++;

    if (isBlockScalarHeader(rest)) {
      map[key] = parseBlockScalar(ctx, indent, rest[0] === ">");
    } else if (rest === "") {
      map[key] = parseChildBlock(ctx, indent);
    } else {
      map[key] = parseScalar(rest, ctx.i - 1);
    }
  }

  return map;
}

function parseSequence(ctx, indent) {
  const arr = [];

  for (;;) {
    skipBlankLines(ctx);
    if (ctx.i >= ctx.lines.length) break;

    const line = ctx.lines[ctx.i];
    const ind = indentOf(line, ctx.i);
    if (ind < indent) break;
    if (ind > indent) throw new YamlError(`Unexpected indentation — this line does not align with its block (for a multi-line value, start it with "> " or "| " after the colon): ${line.trim()}`, ctx.i);

    const content = line.slice(ind);
    if (!isSequenceMarker(content)) break;

    const after = content.slice(1);
    const inlineItem = after.trim();

    if (inlineItem === "") {
      ctx.i++;
      arr.push(parseChildBlock(ctx, indent));
      continue;
    }

    const leadSpaces = after.length - after.trimStart().length;
    const itemIndent = ind + 1 + leadSpaces;
    const itemContent = after.trimStart();

    if (findKeyColon(itemContent) !== -1) {
      // Compact "- key: value": rewrite the line so its first key sits at the
      // item's column, then let the mapping parser consume it and its siblings.
      ctx.lines[ctx.i] = " ".repeat(itemIndent) + itemContent;
      arr.push(parseMapping(ctx, itemIndent));
    } else if (looksLikeMalformedKey(inlineItem)) {
      throw new YamlError(`Expected "key: value" — is a space missing after ":"? Got: ${inlineItem}`, ctx.i);
    } else {
      ctx.i++;
      arr.push(parseScalar(inlineItem, ctx.i - 1));
    }
  }

  return arr;
}

// Parse a block value (mapping or sequence) that lives on the lines following a
// "key:" or "-". A block sequence may align with its parent key (the one YAML
// construct allowed to); anything else must be indented deeper. Returns null
// for an empty value.
function parseChildBlock(ctx, parentIndent) {
  skipBlankLines(ctx);
  if (ctx.i >= ctx.lines.length) return null;
  const ind = indentOf(ctx.lines[ctx.i], ctx.i);
  if (ind < parentIndent) return null;
  if (ind === parentIndent) {
    return isSequenceMarker(ctx.lines[ctx.i].slice(ind)) ? parseSequence(ctx, ind) : null;
  }
  return parseNode(ctx, ind);
}

function parseBlockScalar(ctx, parentIndent, folded) {
  // Collect the block's lines first, then strip the common (minimum) indent so
  // a line indented less than the first one is never over-sliced.
  const collected = [];
  const indents = [];

  while (ctx.i < ctx.lines.length) {
    const line = ctx.lines[ctx.i];
    if (line.trim() === "") {
      collected.push(null);
      ctx.i++;
      continue;
    }
    const ind = indentOf(line, ctx.i);
    if (ind <= parentIndent) break;
    collected.push(line);
    indents.push(ind);
    ctx.i++;
  }

  const blockIndent = indents.length ? Math.min(...indents) : parentIndent + 1;
  const raw = collected.map((line) => (line === null ? "" : line.slice(blockIndent)));

  while (raw.length && raw[0] === "") raw.shift();
  while (raw.length && raw[raw.length - 1] === "") raw.pop();

  if (!folded) return raw.join("\n");

  let out = "";
  for (const piece of raw) {
    if (piece === "") {
      out += "\n";
    } else {
      if (out && !out.endsWith("\n")) out += " ";
      out += piece.trim();
    }
  }
  return out;
}

function parseScalar(value, lineNo) {
  if (value === "") return null;

  const first = value[0];
  if (first === '"' || first === "'") return parseQuoted(value, lineNo);
  if (first === "[") return parseFlowSequence(value, lineNo);
  if (first === "{") return parseFlowMapping(value, lineNo);

  // Plain scalar: a "#" that starts the value is a whole-line comment (null
  // value). A "#" after a space would start an inline comment and silently
  // truncate the value, so we reject it loudly — a literal "#" must be quoted
  // (e.g. bio: "Autist #3."). Trailing comments are still allowed after quoted
  // values, flow collections, and block-scalar headers.
  if (first === "#") return null;
  if (/\s#/.test(value)) {
    throw new YamlError(`A "#" after a space starts a comment — wrap the value in double quotes to keep a literal "#": ${value}`, lineNo);
  }

  if (value === "null" || value === "Null" || value === "NULL" || value === "~") return null;
  if (value === "true" || value === "True" || value === "TRUE") return true;
  if (value === "false" || value === "False" || value === "FALSE") return false;
  if (/^[-+]?\d+$/.test(value)) return Number(value);
  if (/^[-+]?(?:\d+\.\d*|\.\d+|\d+(?:[eE][-+]?\d+))$/.test(value)) return Number(value);
  return value;
}

function parseQuoted(value, lineNo) {
  const quote = value[0];

  // Find the true matching close quote (honoring "\\" / '\\"' escapes and the
  // '' single-quote escape) rather than the last quote on the line, then make
  // sure nothing but whitespace follows — otherwise text would be silently
  // dropped (e.g. `tagline: "a" and more`).
  let end = -1;
  for (let i = 1; i < value.length; i++) {
    const char = value[i];
    if (quote === '"' && char === "\\") {
      i++;
      continue;
    }
    if (char === quote) {
      if (quote === "'" && value[i + 1] === "'") {
        i++;
        continue;
      }
      end = i;
      break;
    }
  }

  if (end === -1) {
    const hint = quote === "'" ? ' — a value starting with an apostrophe must be wrapped in double quotes, e.g. "\'em all"' : "";
    throw new YamlError(`Unterminated quoted string: ${value}${hint}`, lineNo);
  }
  const after = value.slice(end + 1).trim();
  if (after !== "" && after[0] !== "#") {
    throw new YamlError(`Unexpected text after closing quote: ${value}`, lineNo);
  }

  const body = value.slice(1, end);
  if (quote === "'") return body.replace(/''/g, "'");
  return body
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\");
}

function parseFlowSequence(value, lineNo) {
  const close = findFlowClose(value);
  if (close === -1) throw new YamlError(`Unterminated flow sequence (it must be on one line, e.g. [michael, justin]): ${value}`, lineNo);
  const after = value.slice(close + 1).trim();
  if (after !== "" && after[0] !== "#") throw new YamlError(`Unexpected text after "]": ${value}`, lineNo);
  return splitFlow(value.slice(1, close)).map((item) => parseScalar(item, lineNo));
}

function parseFlowMapping(value, lineNo) {
  const close = findFlowClose(value);
  if (close === -1) throw new YamlError(`Unterminated flow mapping: ${value}`, lineNo);
  const after = value.slice(close + 1).trim();
  if (after !== "" && after[0] !== "#") throw new YamlError(`Unexpected text after "}": ${value}`, lineNo);
  const map = {};
  for (const pair of splitFlow(value.slice(1, close))) {
    const colon = findKeyColon(pair);
    if (colon === -1) throw new YamlError(`Invalid flow mapping entry: ${pair}`, lineNo);
    const key = parseKey(pair.slice(0, colon), lineNo);
    if (Object.prototype.hasOwnProperty.call(map, key)) throw new YamlError(`Duplicate key "${key}" in flow mapping`, lineNo);
    map[key] = parseScalar(pair.slice(colon + 1).trim(), lineNo);
  }
  return map;
}

// Index of the bracket/brace that closes the flow collection that opens at
// value[0], honoring nesting and quotes (so "[" or "}" inside a quoted item
// does not throw off the match), or -1 if unterminated.
function findFlowClose(value) {
  let depth = 0;
  let inSingle = false;
  let inDouble = false;

  for (let i = 0; i < value.length; i++) {
    const char = value[i];
    if (char === '"' && !inSingle) inDouble = !inDouble;
    else if (char === "'" && !inDouble) inSingle = !inSingle;
    else if (!inSingle && !inDouble) {
      if (char === "[" || char === "{") depth++;
      else if (char === "]" || char === "}") {
        depth--;
        if (depth === 0) return i;
      }
    }
  }
  return -1;
}

function splitFlow(inner) {
  const items = [];
  let buf = "";
  let inSingle = false;
  let inDouble = false;
  let depth = 0;

  for (const char of inner) {
    if (char === '"' && !inSingle) inDouble = !inDouble;
    else if (char === "'" && !inDouble) inSingle = !inSingle;

    if (!inSingle && !inDouble) {
      if (char === "[" || char === "{") depth++;
      else if (char === "]" || char === "}") depth--;
      else if (char === "," && depth === 0) {
        items.push(buf);
        buf = "";
        continue;
      }
    }
    buf += char;
  }

  if (buf.trim() !== "" || items.length) items.push(buf);
  return items.map((item) => item.trim()).filter((item) => item !== "");
}

function parseKey(raw, lineNo) {
  const key = raw.trim();
  if (key[0] === '"' || key[0] === "'") return parseQuoted(key, lineNo);
  return key;
}

function isSequenceMarker(content) {
  return content[0] === "-" && (content.length === 1 || content[1] === " ");
}

function isBlockScalarHeader(rest) {
  // ">" or "|" with optional chomping/keep indicator and an optional trailing
  // comment (e.g. "description: > # note").
  return /^[>|][+-]?\d*(\s+#.*)?$/.test(rest);
}

// Index of the colon that terminates a mapping key (a ":" followed by a space
// or end of line, outside quotes), or -1 when the line is not a key line.
function findKeyColon(content) {
  let inSingle = false;
  let inDouble = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '"' && !inSingle) inDouble = !inDouble;
    else if (char === "'" && !inDouble) inSingle = !inSingle;
    else if (char === ":" && !inSingle && !inDouble) {
      const next = content[i + 1];
      if (next === undefined || next === " " || next === "\t") return i;
    }
  }
  return -1;
}

// A trimmed line that is not a recognized key/sequence but looks like an
// attempted "key:value" (missing the space after the colon) — used to fail
// loudly instead of silently turning a field into a scalar. URL schemes
// ("key://...") and quoted values are left alone.
function looksLikeMalformedKey(content) {
  const colon = content.indexOf(":");
  if (colon <= 0) return false;
  if (content[0] === '"' || content[0] === "'") return false;
  if (!/^[\w-]+$/.test(content.slice(0, colon))) return false;
  const next = content[colon + 1];
  if (next === undefined || next === " " || next === "\t") return false;
  if (content.slice(colon + 1, colon + 3) === "//") return false;
  return true;
}

function indentOf(line, lineNo) {
  let n = 0;
  while (n < line.length && line[n] === " ") n++;
  if (line[n] === "\t") throw new YamlError("Tabs are not allowed for indentation", lineNo);
  return n;
}

function isSkippable(line) {
  const trimmed = line.trim();
  return trimmed === "" || trimmed[0] === "#";
}

function skipBlankLines(ctx) {
  while (ctx.i < ctx.lines.length && isSkippable(ctx.lines[ctx.i])) ctx.i++;
}
