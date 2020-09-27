# ✍️ Grammar

This directory contains the ANTLR grammar source (`prerequisites.g4`) and all derived files using [`antlr4ts`](https://github.com/tunnelvisionlabs/antlr4ts).

They should be added to version control and only regenerated if the source changes. To recompile the grammar, run:

```sh
yarn run gen-parser
```

## ℹ️ Note

Currently, the `antlr4ts` library is broken slightly, (see [tunnelvisionlabs/antlr4ts/485](https://github.com/tunnelvisionlabs/antlr4ts/issues/485)), so we need to add the following comment at the top of **both** `PrerequisitesLexer.ts` and `PrerequisitesParser.ts`:

```
// @ts-nocheck
```
