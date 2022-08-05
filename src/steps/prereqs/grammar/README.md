# ✍️ Grammar

This directory contains the ANTLR grammar source (`prerequisites.g4`) and all derived files using [`antlr4ts`](https://github.com/tunnelvisionlabs/antlr4ts).

They should be added to version control only regenerated if the source changes. To recompile the grammar, run:

```sh
yarn run gen-parser
```

This is enforced at CI time by comparing the generated files with the ones in source control (see TODO).
