# Contracts

## Deployments

| Contract       | Address                                                                                                                      |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Implementation | [0xA5470ED010aad98A08B50474199B7Ae4D371Ba17](https://base.blockscout.com/address/0xA5470ED010aad98A08B50474199B7Ae4D371Ba17) |
| Factory        | [0xCA7E034982418FFAf975D292AF27Ce718fC03dF3](https://base.blockscout.com/address/0xCA7E034982418FFAf975D292AF27Ce718fC03dF3) |

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

Idk [this guide](https://hardhat.org/docs/learn-more/smart-contract-verification) isn't working for Etherscan :/

Theoretically:

```bash
pnpm hardhat verify --network sepolia 0x1234567890...
```

Works on Blockscout though!

## Todo

- [ ] Add a judging window (90 day hardcoded or user-defined)
- [ ] Add ability for judge to refund the bet
