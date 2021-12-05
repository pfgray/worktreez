import path from 'path'
import * as O from 'fp-ts/lib/Option'
import * as RTE from 'fp-ts/lib/ReaderTaskEither'
import * as A from 'fp-ts/lib/Array'
import { flow, pipe } from 'fp-ts/lib/function'
import { FS, PathNotFound, ReadError } from '../../files/FS'
import { Dir, isRoot, liftDir, parentDir } from '../../files/Dir'

export type WorktreezDirNotFound = {
  _type: 'WorktreezDirNotFound'
  contextDir: Dir
}

const worktreezDirNotFound = (contextDir: Dir): WorktreezDirNotFound => ({
  _type: 'WorktreezDirNotFound',
  contextDir,
})

export const WorktreezConfigDirName = '.worktreez'

export const tap =
  (message: string) =>
  <A>(a: A) => {
    console.log(message)
    return a
  }

export const tapWith =
  <A>(message: string, f: (a: A) => string) =>
  (a: A) => {
    console.log(message, f(a))
    return a
  }

/**
 * Given a directory, search up the directory tree for a .worktreez directory
 * @param dir
 */
export const findWorktreezDir = (
  dir: Dir
): RTE.ReaderTaskEither<
  never,
  WorktreezDirNotFound | ReadError | PathNotFound,
  Dir
> => {
  const inner = (
    innerDir: Dir
  ): RTE.ReaderTaskEither<
    never,
    WorktreezDirNotFound | ReadError | PathNotFound,
    Dir
  > =>
    pipe(
      FS.readDir(innerDir),
      RTE.map(
        flow(
          A.findFirst(s => {
            return s === WorktreezConfigDirName
          }),
          O.map(() => path.join(innerDir, WorktreezConfigDirName))
        )
      ),
      RTE.chainW(
        O.fold(
          () => RTE.of(O.none),
          found =>
            pipe(
              FS.stat(found),
              RTE.map(st =>
                st.isDirectory() ? O.some(liftDir(found)) : O.none
              )
            )
        )
      ),
      RTE.chainW(
        O.foldW(
          () =>
            isRoot(innerDir)
              ? RTE.left(worktreezDirNotFound(dir))
              : inner(parentDir(innerDir)),
          RTE.of
        )
      )
    )
  return inner(dir)
}
