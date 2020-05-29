import { exec, ExecException } from 'child_process'
import path from 'path'
import tmp, { withFile, tmpName } from 'tmp-promise'
import fs from 'fs'

tmp.setGracefulCleanup()

const IS_WIN32 = process.platform === 'win32'

function stringify(val: string | Buffer): string {
  if (typeof val === 'string') {
    return val
  } else if (Buffer.isBuffer(val)) {
    return val.toString('utf8')
  } else {
    return ''
  }
}

export interface TypeCheckResult {
  status: 'OK' | 'FAILED' | 'UNKNOWN'
  log: string
}

export interface CompilationResult extends TypeCheckResult {
  outputFile: string
}

export interface ExecutionResult {
  compilation: CompilationResult
  output: string
  exitCode: number | null
  error: string | null
}

const COMPILER_MSG = 'compilation terminated due to -Wfatal-errors.'

function makeResult(
  error: ExecException,
  stdout: string,
  stderr: string
): TypeCheckResult {
  const log = (stringify(stdout) + '\n' + stringify(stderr))
    .replace(COMPILER_MSG, '')
    .trim()
  const status = error ? (stderr ? 'FAILED' : 'UNKNOWN') : 'OK'
  return { status, log }
}

export function typeCheckFile(file: string): Promise<TypeCheckResult> {
  return new Promise((resolve) => {
    exec(
      `g++ -Wall -Wextra -Wfatal-errors -fsyntax-only "${path.basename(file)}"`,
      { cwd: path.dirname(file), timeout: 5000 },
      (error, stdout, stderr) => {
        resolve(makeResult(error, stdout, stderr))
      }
    )
  })
}

function withSource<T>(
  source: string,
  fn: (path: string) => Promise<T>
): Promise<T> {
  return withFile(
    ({ fd, path }) => {
      return new Promise((resolve, reject) => {
        fs.write(fd, source, async (err) => {
          if (err) {
            reject(err)
          } else {
            try {
              const result = await fn(path)
              resolve(result)
            } catch (e) {
              reject(e)
            }
          }
        })
      })
    },
    { postfix: '.cpp' }
  )
}

export function typeCheckSource(source: string): Promise<TypeCheckResult> {
  return withSource(source, (path) => typeCheckFile(path))
}

export async function compileFile(
  file: string,
  outputFile?: string
): Promise<CompilationResult> {
  if (!outputFile) {
    outputFile = await tmpName({ postfix: IS_WIN32 ? '.exe' : '' })
  }

  return new Promise((resolve) => {
    const cwd = path.dirname(file)
    exec(
      `g++ -Wall -Wextra -Wfatal-errors "${path.basename(
        file
      )}" -o "${outputFile}"`,
      { cwd, timeout: 5000 },
      (error, stdout, stderr) => {
        resolve({
          ...makeResult(error, stdout, stderr),
          outputFile: path.resolve(cwd, outputFile)
        })
      }
    )
  })
}

export function compileSource(
  source: string,
  outputFile: string
): Promise<CompilationResult> {
  return withSource(source, (path) => compileFile(path, outputFile))
}

export async function evalFile(file: string): Promise<ExecutionResult> {
  const compilation = await compileFile(file)
  if (compilation.status !== 'OK') {
    return {
      compilation,
      output: '',
      exitCode: null,
      error: 'Compilation failed.'
    }
  }

  return new Promise((resolve) => {
    exec(
      path.basename(compilation.outputFile),
      {
        cwd: path.dirname(compilation.outputFile),
        timeout: 500
      },
      (error, stdout, stderr) => {
        fs.unlink(compilation.outputFile, (err) => {
          if (err) {
            console.error(err)
          }
        })

        const output = (stringify(stdout) + '\n' + stringify(stderr)).trim()
        resolve({
          compilation,
          output,
          exitCode: error ? error.code || 1 : 0,
          error: error ? error.message || 'Unknown error.' : null
        })
      }
    )
  })
}

export function evalSource(source: string): Promise<ExecutionResult> {
  return withSource(source, (file) => evalFile(file))
}

export async function simpleEval(source: string): Promise<string> {
  const result = await evalSource(source)
  return result.output || result.error || ''
}
