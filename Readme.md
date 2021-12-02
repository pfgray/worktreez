File structure:

You can use the `init` command to initialize a worktreez folder.

```
wt init git@github.com:pfgray/worktreez.git
```

This will clone a bare version of the repository into a `.worktreez` directory, and create a worktree with the default branch in a `repo1` directory.

Inside a worktreez folder, you can use the `switch` command to switch to a different branch.

```
wt switch
```

Worktreez will search up the directory tree, looking for a `.worktreez` folder, and use that to list the branches checked out.

The `switch` command can take an optional branch name to switch to. If the branch is not checked out in an existing worktree, you will be provided with a list of the worktrees that are checked out, and you can choose a branch to replace with the provided branch (provided there are no changes)
