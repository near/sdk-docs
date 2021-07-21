---
sidebar_position: 1
sidebar_label: Rapid Prototyping
title: "Upgrading Contracts: Rapid Prototyping"
---

# Upgrading Contracts

When you change the interface of a contract and re-deploy it, you may see this error:

    Cannot deserialize the contract state.

This happens more when using [Borsh](../contract-interface/serialization-interface) than JSON serialization. Why? With JSON, your [semver](https://semver.org/) mental model applies: if you make a change that wouldn't result in a major-version upgrade, such as adding a new key to an existing data structure, then your contract upgrade usually works just fine. But with Borsh, even such safe-seeming changes result in a different serialization for the entire contract, so the NEAR runtime can't figure out how fetch the contract's state based on the current contract code.

How can you avoid such errors?

When you're still in the Research & Development phase, building a prototype and deploying it locally or on [testnet](https://docs.near.org/docs/concepts/networks), you can just delete all previous contract state when you make a breaking change. See below for a couple ways to do this.

When you're ready to deploy a more stable contract, there are a couple [production strategies](./production-basics) that will help you update contract state without deleting it all. And once your contract graduates from "trusted mode" (when maintainers control a [Full Access key](https://docs.near.org/docs/concepts/account#access-keys)) to community-governed mode (no more Full Access keys), you'll need to know how to upgrade your contract code itself [via a DAO vote](./via-dao-vote).


## Rapid Prototyping: Delete Everything All The Time

There are two ways to delete all account state:

1. `rm -rf neardev && near dev-deploy`
2. Deleting & recreating contract account

For both cases, let's consider the following example.

The [rust-status-message](https://github.com/near-examples/rust-status-message) example contract has the following structure:

```rust reference
https://github.com/near-examples/rust-status-message/blob/61de649d8311bef5957c129e6ad1407101a0f873/src/lib.rs#L7-L31
```

Let's say you deploy this contract to testnet, then call it with:

```bash
near call [contract] set_status '{"message": "lol"}' --accountId you.testnet
near view [contract] get_status '{"account_id": "you.testnet"}'
```

This will return the message that you set with the call to `set_status`, in this case `"lol"`.

At this point the contract is deployed and has some state. 

Now let's say you change the contract to store two kinds of data for each account:

```rust reference
https://github.com/near-examples/rust-status-message/blob/a39e1fc55ee018b631e3304ba6f0884b7558873e/src/lib.rs#L7-L42
```

You build & deploy the contract again, thinking that maybe because the new `taglines` LookupMap has the same prefix as the old `records` LookupMap (the prefix is `r`, set by `LookupMap::new(b"r".to_vec())`), the tagline for `you.testnet` should be `"lol"`. But when you `near view` the contract, you get the "Cannot deserialize" message. What to do?

### 1. `rm -rf neardev && near dev-deploy`

When first getting started with a new project, the fastest way to deploy a contract is [`dev-deploy`](https://docs.near.org/docs/concepts/account#how-to-create-a-dev-account):

```bash
near dev-deploy [--wasmFile ./path/to/compiled.wasm]
```

This does a few things:

1. Creates a new testnet account with a name like `dev-1626793583587-89195915741581`
2. Stores this account name in a `neardev` folder within the project
3. Stores the private key for this account in the `~/.near-credentials` folder
4. Deploys your contract code to this account

The next time you run `dev-deploy`, it checks the `neardev` folder and re-deploys to the same account rather than making a new one.

But in the example above, we want to delete the account state. How do we do that?

The easiest way is just to delete the `neardev` folder, then run `near dev-deploy` again. This will create a brand new testnet account, with its own (empty) state, and deploy the updated contract to it.

### 2. Deleting & recreating contract account

If you want to have a predictable account name rather than an ever-changing `dev-*` account, the best way is probably to create a sub-account:

```bash title="Create sub-account"
near create-account app-name.you.testnet --masterAccount you.testnet
```

Then deploy your contract to it:

```bash title="Deploy to sub-account"
near deploy --accountId app-name.you.testnet [--wasmFile ./path/to/compiled.wasm]
```

In this case, how do you delete all contract state and start again? Delete the sub-account and recreate it.

```bash title="Delete sub-account"
near delete app-name.you.testnet you.testnet
```

This sends all funds still on the `app-name.you.testnet` account to `you.testnet` and deletes the contract that had been deployed to it, including all contract state.

Now you create the sub-account and deploy to it again using the commands above, and it will have empty state like it did the first time you deployed it.
