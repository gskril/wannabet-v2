# Contracts

## Deployments

| Contract       | Address                                                                                                               |
| -------------- | --------------------------------------------------------------------------------------------------------------------- |
| Implementation | [0xD57D184fe57C9D35033558baC301c90dA5282C4a](https://basescan.org/address/0xD57D184fe57C9D35033558baC301c90dA5282C4a) |
| Factory        | [0x0F0A585aF686397d94428825D8cCfa2589b159A0](https://basescan.org/address/0x0F0A585aF686397d94428825D8cCfa2589b159A0) |

## Usage

### Test

To run all the tests in the project, execute the following command:

```shell
pnpm run test
```

### Deploy

This project includes an example Ignition module to deploy the contract. You can deploy this module to a locally simulated chain or to Sepolia.

To run the deployment to a local chain:

```shell
pnpm hardhat ignition deploy ignition/modules/deployFactory.ts --network base --strategy create2
```

Note: You need to set the `DEPLOYER_PRIVATE_KEY` using the `hardhat-keystore` plugin:

```bash
pnpm hardhat keystore set DEPLOYER_PRIVATE_KEY
```

After setting the variable, you can run the deployment with the Sepolia network:

### Verify

[This guide](https://hardhat.org/docs/learn-more/smart-contract-verification) isn't working for Etherscan, but I was able to get it working via the steps described in [this issue](https://github.com/NomicFoundation/hardhat/issues/7623).

```bash
pnpm hardhat verify --network sepolia 0x1234567890...
```

## Todo

Feature we didn't get to implement during the hackathon, but will be adding afterwards.

- [ ] Add a judging window (90 day hardcoded or user-defined)
- [ ] Add ability for judge to refund the bet
