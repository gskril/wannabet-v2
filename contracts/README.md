# Contracts

## Deployments

| Contract       | Address                                                                                                                      |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Implementation | [0x234186b59d13b3C45923702B15ddAb99C0A8a66F](https://base.blockscout.com/address/0x234186b59d13b3C45923702B15ddAb99C0A8a66F) |
| Factory        | [0xc5d1f528d82BFF423a38De20b448Ff914c6DfEE6](https://base.blockscout.com/address/0xc5d1f528d82BFF423a38De20b448Ff914c6DfEE6) |

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
