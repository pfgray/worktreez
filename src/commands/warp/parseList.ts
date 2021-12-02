import * as S from 'parser-ts/string'
import * as C from 'parser-ts/char'
import * as P from 'parser-ts/Parser'
import { flow, pipe } from 'fp-ts/lib/function'
import * as E from 'fp-ts/Either'

import { run } from 'parser-ts/code-frame'
import { bare, hashAndBranch } from './FolderDetails'
import { DirC } from '../../files/Dir'

const input = `/home/paul/dev/chainable-components/.worktree              (bare)
/home/paul/dev/chainable-components/foo                    d98443c [new_do]
/home/paul/dev/chainable-components/parity_with_recompose  b082d42 [parity_with_recompose]`

const pathP = pipe(
  P.takeUntil<string>(s => s === ' '),
  P.map(s => s.join('')),
  P.chain(
    flow(
      DirC.decode,
      E.foldW(() => P.fail(), P.of)
    )
  )
)

const hashAndBranchP = pipe(
  P.many1(C.alphanum),
  P.map(s => s.join('')),
  P.bindTo('hash'),
  P.chainFirst(() => C.space),
  P.bind('branch', () =>
    pipe(
      C.char('['),
      P.chain(() => P.takeUntil(s => s === ']')),
      P.map(s => s.join(''))
    )
  ),
  P.chainFirst(() => C.char(']')),
  P.map(({ hash, branch }) => hashAndBranch(hash, branch))
)

const bareP = pipe(
  S.string('(bare)'),
  P.map(() => bare)
)

const detailsP = pipe(P.either(hashAndBranchP, () => bareP))

const rowP = pipe(
  pathP,
  P.bindTo('path'),
  P.chainFirst(() => P.many(C.char(' '))),
  P.bind('details', () => detailsP),
  P.chainFirst(() => P.optional(C.char('\n')))
)

const listP = P.many1(rowP)

// const parsePath =
export const parseList = (input: string) => run(listP, input)
