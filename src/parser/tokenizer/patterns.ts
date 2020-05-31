export const COMMENT = /\/\/.*?$/

export const MULTILINE_COMMENT = {
  match: /\/\*(?:.|\r?\n)*?\*\//,
  lineBreaks: true
}

export const STRING = /"[^"\\]*(?:\\.[^"\\]*)*"/

export const CHAR = /'[^'\\]*(?:\\.[^'\\]*)*'/
