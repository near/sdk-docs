---
sidebar_position: 3
---

# Deploy Contract Through Contract

There are a few reasons why you might want to deploy a contract on-chain. One reason is if there is a contract directly related to the one deploying it. This way, all of the initialization can happen on-chain and doesn't require the deployments of the two contracts to happen in multiple transactions.

Deploying a contract to a new address programatically can be done as follows:

```rust
let code: Vec<u8> = /* Can use static bytes embedded into contract or pass in through parameters */;
let account_id: AccountId = /* Initialize or use an existing AccountId */;

Promise::new(account_id).create_account().deploy_contract(code);
```

Where the code bytes can either be included in the contract code with `include_bytes!("<path to wasm file>")` or passed in through parameters (keep in mind transaction size is currently limited to 4MB).

This call uses the [`create_account()`](https://docs.rs/near-sdk/latest/near_sdk/struct.Promise.html#method.create_account) instruction from [the previous section](create-account.md), but this call can be dropped to just redeploy the code.

Also, since this creation is done with a [`Promise`](https://docs.rs/near-sdk/latest/near_sdk/struct.Promise.html), this action can be combined with [`transfer`](https://docs.rs/near-sdk/latest/near_sdk/struct.Promise.html#method.transfer) to initialize the contract with funds or [`add_access_key`](https://docs.rs/near-sdk/latest/near_sdk/struct.Promise.html#method.add_access_key) to allow certain accounts to call methods on this new contract, for example.
