# Wanna Bet?

WannaBet originally launched in July 2024 as a simple peer-to-peer betting app. We're ([limes](https://farcaster.xyz/limes.eth), [slobo](https://farcaster.xyz/slobo.eth), [greg](https://farcaster.xyz/greg)) now rebuilding it from the ground up with a focus on smart contract composability and a mini app-first UX.

## Contributing

This is a pnpm monorepo with the following packages: [`web`](./web/README.md), [`shared`](./shared/README.md), [`contracts`](./contracts/README.md).

To get started, run `pnpm install` in the root to install the dependencies for all packages. Then run the relevant `dev` or `build` scripts found in any of the `package.json` files.

> [!NOTE]
> When installing new packages, first check to see if it's already being used elsewhere in the repo. If it is, pin it in [`pnpm-workspace.yaml`](./pnpm-workspace.yaml) and set the version in `package.json` to `catalog:`.
