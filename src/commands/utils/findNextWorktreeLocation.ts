import { Dir } from '../../files/Dir'
import path from 'path'
import { FS } from '../../files/FS'
import { flow, pipe } from 'fp-ts/lib/function'
import * as RTE from 'fp-ts/lib/ReaderTaskEither'
import * as A from 'fp-ts/lib/Array'
import * as Str from 'fp-ts/lib/String'

const WorktreeDirPrefix = 'worktree'

export const findNextWorktreeLocation = (worktreezDir: Dir) =>
  pipe(FS.readDir(path.parse(worktreezDir).dir), RTE.map(nextAvailableWorktree))

const nextAvailableWorktree = (files: string[]) => {
  const inner =
    (idx: number) =>
    (files: string[]): string => {
      const nextWorktreeName = `${WorktreeDirPrefix}${idx}`
      return pipe(
        files,
        A.dropLeftWhile(name => name !== nextWorktreeName),
        a => (A.isNonEmpty(a) ? inner(idx + 1)(a) : nextWorktreeName)
      )
    }

  return pipe(files, A.sort(Str.Ord), inner(1))
}
