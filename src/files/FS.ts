import { pipe } from 'fp-ts/function'
import * as fs from 'fs'
import { makeMatchers } from 'ts-adt/MakeADT'
import * as TE from 'fp-ts/TaskEither'
import * as RTE from 'fp-ts/ReaderTaskEither'

const [matchTag] = makeMatchers('_tag')

const pathNotFound = (path: string) => ({
  _type: `PathNotFound` as const,
  path,
})

const readError = (path: string) => ({
  _type: `ReadError` as const,
  path,
})

const fsReadFile = RTE.fromTaskEitherK(
  TE.taskify<
    fs.PathOrFileDescriptor,
    { encoding: BufferEncoding },
    NodeJS.ErrnoException,
    string
  >(fs.readFile)
)
const readFile = (path: string) =>
  pipe(
    fsReadFile(path, { encoding: 'utf-8' }),
    RTE.mapLeft(err =>
      err.code === 'ENOENT' ? pathNotFound(path) : readError(path)
    )
  )

const fsWriteFile = TE.taskify<
  fs.PathOrFileDescriptor,
  string | NodeJS.ArrayBufferView,
  fs.WriteFileOptions,
  NodeJS.ErrnoException,
  void
>(fs.writeFile)
const writeFile = (path: string, data: string | NodeJS.ArrayBufferView) =>
  pipe(
    RTE.fromTaskEither(fsWriteFile(path, data, { encoding: 'utf-8' })),
    RTE.mapLeft(err =>
      err.code === 'ENOENT' ? pathNotFound(path) : readError(path)
    )
  )

const fsOpen = TE.taskify<
  fs.PathOrFileDescriptor,
  string,
  NodeJS.ErrnoException,
  number
>(fs.open)
const open = (path: string, flags: string) =>
  pipe(
    RTE.fromTaskEither(fsOpen(path, flags)),
    RTE.mapLeft(err =>
      err.code === 'ENOENT' ? pathNotFound(path) : readError(path)
    )
  )

export const FS = {
  readFile,
  writeFile,
  open,
}
