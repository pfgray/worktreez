import { pipe } from 'fp-ts/function'
import * as fs from 'fs'
import * as TE from 'fp-ts/TaskEither'
import * as RTE from 'fp-ts/ReaderTaskEither'

export type PathNotFound = {
  _type: `PathNotFound`
  path: fs.PathOrFileDescriptor
}
const pathNotFound = (path: fs.PathOrFileDescriptor) => ({
  _type: `PathNotFound` as const,
  path,
})

export type ReadError = { _type: `ReadError`; path: fs.PathOrFileDescriptor }
const readError = (path: fs.PathOrFileDescriptor) => ({
  _type: `ReadError` as const,
  path,
})

const handleEnoent = (path: fs.PathOrFileDescriptor) =>
  pipe(
    RTE.mapLeft((err: NodeJS.ErrnoException) =>
      err.code === 'ENOENT' ? pathNotFound(path) : readError(path)
    )
  )

const fsReadFile = RTE.fromTaskEitherK(
  TE.taskify<
    fs.PathOrFileDescriptor,
    { encoding: BufferEncoding },
    NodeJS.ErrnoException,
    string
  >(fs.readFile)
)
const readFile = (path: string) =>
  pipe(fsReadFile(path, { encoding: 'utf-8' }), handleEnoent(path))

const fsWriteFile = TE.taskify<
  fs.PathOrFileDescriptor,
  string | NodeJS.ArrayBufferView,
  fs.WriteFileOptions,
  NodeJS.ErrnoException,
  void
>(fs.writeFile)
const writeFile = (
  path: fs.PathOrFileDescriptor,
  data: string | NodeJS.ArrayBufferView
) =>
  pipe(
    RTE.fromTaskEither(fsWriteFile(path, data, { encoding: 'utf-8' })),
    handleEnoent(path)
  )

const fsOpen = TE.taskify<
  fs.PathOrFileDescriptor,
  string,
  NodeJS.ErrnoException,
  number
>(fs.open)
const open = (path: string, flags: string) =>
  pipe(RTE.fromTaskEither(fsOpen(path, flags)), handleEnoent(path))

const fsReaddir = TE.taskify<
  fs.PathLike,
  BufferEncoding,
  NodeJS.ErrnoException,
  string[]
>(fs.readdir)
export const readDir = (dir: string) =>
  pipe(RTE.fromTaskEither(fsReaddir(dir, 'utf-8')), handleEnoent(dir))

const fsStat = TE.taskify<fs.PathLike, NodeJS.ErrnoException, fs.Stats>(fs.stat)
export const stat = (path: string) =>
  pipe(RTE.fromTaskEither(fsStat(path)), handleEnoent(path))

export const FS = {
  readFile,
  writeFile,
  readDir,
  stat,
  open,
}
