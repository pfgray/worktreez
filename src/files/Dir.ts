import * as t from 'io-ts'
import path from 'path'

interface DirBrand {
  readonly Dir: unique symbol // use `unique symbol` here to ensure uniqueness across modules / packages
}

export const DirC = t.brand(
  t.string,
  (s): s is t.Branded<string, DirBrand> => true,
  'Dir'
)

export const liftDir = (s: string) => s as Dir

export const parentDir = (d: Dir) => (isRoot(d) ? d : liftDir(path.dirname(d)))

export const isRoot = (d: Dir) => d === '/'

export type Dir = t.TypeOf<typeof DirC>
