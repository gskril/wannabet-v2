# Contracts

## Deployments

| Contract       | Address                                                                                                               |
| -------------- | --------------------------------------------------------------------------------------------------------------------- |
| Implementation | [0x51f4E1df3A1F5527Bd076cE2c9b46B0AE76a4332](https://basescan.org/address/0x51f4E1df3A1F5527Bd076cE2c9b46B0AE76a4332) |
| Factory        | [0xc1285D12f175c32C4A7FCd4B324Aa3BC9C1dceA3](https://basescan.org/address/0xc1285D12f175c32C4A7FCd4B324Aa3BC9C1dceA3) |

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
