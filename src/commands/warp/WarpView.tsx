import React, { useState, useEffect } from 'react'
import { render, Text, useApp, useInput } from 'ink'
import { Dir, DirC } from '../../files/Dir'
import { Context } from '../../Context'
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray'
import { FolderDetails } from './FolderDetails'
import { pipe } from 'fp-ts/lib/function'
import * as O from 'fp-ts/lib/Option'
import * as A from 'fp-ts/lib/Array'
import { match } from 'ts-adt'

import SelectInput from 'ink-select-input'

type WarpViewProps = {
  onExit: (d: O.Option<Dir>) => void
  context: Context
  worktrees: NonEmptyArray<{
    path: Dir
    details: FolderDetails
  }>
  /**
   * If true, the user will not be able to select directories with changes
   */
  skipWorktreesWithChanges: boolean
}

export const WarpView = (props: WarpViewProps) => {
  const handleSelect = (item: { value: string }) => {
    pipe(
      DirC.decode(item.value),
      O.fromEither,
      O.map(dir => {
        props.onExit(O.some(dir))
      })
    )
  }

  useInput((input, key) => {
    if (key.escape) {
      props.onExit(O.none)
    }
  })

  return (
    <SelectInput
      items={pipe(
        props.worktrees,
        A.filterMap(a =>
          pipe(
            a.details,
            match({
              bare: () => O.none,
              branch: ({ value }) => O.some(value),
            }),
            O.map(branch => ({
              label: `${branch}`,
              value: a.path,
            }))
          )
        )
      )}
      onSelect={handleSelect}
    />
  )
}
