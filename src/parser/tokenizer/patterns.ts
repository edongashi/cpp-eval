export const COMMENT = /\/\/.*?$/

export const MULTILINE_COMMENT = {
  match: /\/\*(?:.|\n)*?\*\//,
  lineBreaks: true
}

export const STRING = /"[^"\\]*(?:\\.[^"\\]*)*"/

export const CHAR = /'[^'\\]*(?:\\.[^'\\]*)*'/
