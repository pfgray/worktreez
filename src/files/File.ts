import * as t from 'io-ts'

interface FileBrand {
  readonly File: unique symbol // use `unique symbol` here to ensure uniqueness across modules / packages
}

export const FileC = t.brand(
  t.string,
  (s): s is t.Branded<string, FileBrand> => true,
  'File'
)

export const liftFile = (s: string) => s as File

export type File = t.TypeOf<typeof FileC>