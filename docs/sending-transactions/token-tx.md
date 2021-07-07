---
sidebar_position: 1
---

# Transferring NEAR Tokens

Transactions can be sent asynchronously from a contract through a [`Promise`](https://docs.rs/near-sdk/latest/near_sdk/struct.Promise.html). These promises will schedule execution and either execute in parallel or be awaited before resuming the method execution. The most simple transaction to send from a contract is a token transfer.

Transferring NEAR tokens (Ⓝ) to another account is as simple as the following:

```rust
let amount: u128 = 80;
let account_id: AccountId = /* Initialize or use an existing AccountId */;

Promise::new(account_id).transfer(amount as u128);
```

And this will queue the transfer to execute asynchronously. This promise could also be used as any other promise to be queued with another transaction or depend on another's result.
