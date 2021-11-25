
import { ADT } from "ts-adt";

export type FolderDetails = ADT<{
  branch: {
    hash: string
    value: string
  }
  bare: {}
}>

export const hashAndBranch = (hash: string, value: string): FolderDetails => ({_type: 'branch', hash, value} as const)

export const bare: FolderDetails = {_type: 'bare'} as const