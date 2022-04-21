---
sidebar_position: 3
sidebar_label: Workspaces Migration Guide
title: "Workspaces Migration Guide"
---

# Workspaces Migration Guide

NEAR Simulator was meant to be an in-place replacement of a blockchain environment for the purpose of testing NEAR contracts. However, simulating NEAR ledger turned out to be a much more complex endeavour than was anticipated. Eventually, the idea of workspaces was born - a library for automating workflows and writing tests for NEAR smart contracts using a real NEAR network (localnet, testnet or mainnet). Thus, NEAR Simulator is being deprecated in favor of [`workspaces-rs`](https://github.com/near/workspaces-rs), the Rust edition of workspaces. As the two libraries have two vastly different APIs this guide was created to ease the migration process for developers.

:::danger
TODO: I do not have a whole lot of context here why exactly simtests were not suitable for our purposes, so if anyone wants to elaborate the preceding paragraph please do.
:::

This guide presumes that you are transitioning from near-sdk-sim `3.2.0` (the last non-deprecated release) to `workspaces-rs` `0.2.1`. Given that near-sdk-sim is deprecated, it is very unlikely that its API is going to ever change, but future releases of `workspaces-rs` might. Hopefully this guide is going to be helpful even if you are migrating your project to a more recent version, but also feel free to migrate your tests to `0.2.1` using this guide first and upgrade to the most recent workspaces-rs version later by looking at the release notes to see how public API has changed since `0.2.1`.

## Async runtime and error handling

In this section we will be working purely with test signatures, so it applies to pretty much all NEAR contract tests regardless of what is written inside. We will walk through each change one by one. Let's start with how your tests look like right now; chances are something like this:

```rust
#[test]
fn test_transfer() {
    ...
}
```

First big change is that `workspaces-rs` API is asynchronous, meaning that contract function calls return values that implement `Future` trait. You will not be able to operate on the call results in a synchronous environment, thus you will have to add an async runtime (if you do not already have one). In this guide we are going to be using [`tokio`](https://tokio.rs/), but you should be able to use any other alternative (e.g. [`async-std`](https://async.rs/), [`smol`](https://github.com/smol-rs/smol)). Rewrite the test above like this:

```rust
#[tokio::test]
async fn test_transfer() {
    ...
}
```


:::note
If you are using another attribute on top of the standard `#[test]`, make sure it plays nicely with the async runtime of your choosing. For example, if you are using [`test-env-log`](https://crates.io/crates/test-env-log) and `tokio`, then you need to mark your tests with <br/> `#[test_env_log::test(tokio::test)]`.
:::

The second change is that `workspaces-rs` makes an extensive use of [`anyhow::Result`](https://docs.rs/anyhow/latest/anyhow/type.Result.html). Although you can work with `Result` directly, our recommendation is to make your tests return `anyhow::Result<()>` like this:

```rust
#[tokio::test]
async fn test_transfer() -> anyhow::Result<()> {
    ...
}
```

This way you can use `?` anywhere inside the test to safely unpack any `anyhow::Result<R>` type to `R` (will be very useful further down the guide). Note that the test will fail if `anyhow::Result<R>` cannot be unpacked.

## Initialization and deploying contracts

Unlike NEAR Simulator, `workspaces-rs` uses an actual NEAR node and makes all calls through it. First, you need to decide which network you want your tests to be run on:
* `sandbox` - perfect choice if you are just interested in local development and testing; `workspaces-rs` will instantiate a [sandbox](https://github.com/near/sandbox) instance on your local machine which will run an isolated NEAR node.
* `testnet` - an environment much closer to the real world; you can test integrations with other deployed contracts on testnet without bearing any financial risk.
* `mainnet` - a network with reduced amount of features due to how dangerous it can be to do transactions there, but can still be useful for automating deployments and pulling deployed contracts.

In this guide we will be focusing on `sandbox` since it covers the same use cases NEAR Simulator did. But of course feel free to explore whether other networks can be of potential use to you when writing new tests/workflows.

One of the ways to initialize simulator and deploy a contract is shown below (the other way is through `deploy!` macro which we will look at in the next section):

```rust
use near_sdk_sim::{init_simulator, to_yocto};

near_sdk_sim::lazy_static_include::lazy_static_include_bytes! {
    WASM_BYTES => "res/contract.wasm",
}

const ID: &str = "contract-id";

...

let root = init_simulator(...);
let contract = root.deploy(&WASM_BYTES, ID.parse().unwrap(), to_yocto("5"));
```

Although `workspaces-rs` provides a way to specify the account id for a contract to be deployed, usually it does not matter in the context of a single test. If you are fine with generating a random developer account and initializing it with 100N, then you can use replace the snippet above with this:

```rust
let worker = workspaces::sandbox().await?;
let contract = worker.dev_deploy(include_bytes!("../res/contract.wasm")).await?;
```

Alternatively, use this if you care about the account id:

```rust
let worker = workspaces::sandbox().await?;
let (_, sk) = worker.dev_generate().await;
let id: AccountId = "contract-id".parse()?;
let contract = worker
    .create_tla_and_deploy(
        id,
        sk,
        include_bytes!("../examples/res/non_fungible_token.wasm"),
    )
    .await?
    .result;
```

Or, if you want to create a subaccount with a certain balance:

```rust
use near_units::parse_near;

let worker = workspaces::sandbox().await?;
let id: AccountId = "contract-id".parse()?;
let contract = worker
    .root_account()
    .create_subaccount(&worker, id)
    .initial_balance(parse_near!("5 N"))
    .transact()
    .await?
    .result;
```

:::danger
TODO: Is there a reason why we can't control the initial balance with `dev_deploy`?
:::

:::caution
You might have noticed that `init_simulator` used to accept an optional genesis config. Unfortunately, `workspaces-rs` does not support this feature yet, but we are trying to understand the need for this and properly design it. Please feel free to share your use case [here](https://github.com/near/workspaces-rs/issues/68).
:::

## Making transactions and view calls

As always, let's take a look at how we used to make calls with NEAR Simulator:

```rust
// Example 1: No Macros
root.call(
    ft.account_id(),
    "ft_transfer",
    &json!({
        "receiver_id": alice.account_id(),
        "amount": U128::from(transfer_amount)
    })
    .to_string()
    .into_bytes(),
    300_000_000_000_000,
    1,
);

let root_balance: U128 = root.view(
    ft.account_id(),
    "ft_balance_of",
    &json!({
        "account_id": root.account_id()
    })
    .to_string()
    .into_bytes(),
)
.unwrap_json();

// Example 2: With Macros
call!(
    root,
    ft.ft_transfer(alice.account_id(), transfer_amount.into(), None),
    deposit = 1
    gas = 300_000_000_000_000
);

let root_balance: U128 = view!(ft.ft_balance_of(root.account_id())).unwrap_json();
```

Note how Example 2's `call!` and `view!` macros accept a contract function invocation as if it was just regular Rust. Unlike NEAR Simulator, `workspaces-rs` never stores metadata about the deployed contract and hence does not support high-level syntax like that. This might change in the future once our ACI implementation is ready, but for the remainder of this section we will be migrating Example 1.

Workspaces have a unified way of making all types of calls via a [builder](https://doc.rust-lang.org/1.0.0/style/ownership/builders.html) pattern. Generally, calls are constructed by following these steps:

1. Create a `CallBuilder` by invoking `Contract::call`
2. Pass function call arguments via `CallBuilder::args_json` or `CallBuilder::args_borsh` depending on which serialization algorithm your contract is using
3. Configure gas and deposit (if needed) via `CallBuilder::gas` and `CallBuilder::deposit`
4. Finalize the call by consuming builder via `CallBuilder::transaction` or `CallBuilder::view` depending on what kind of call you want to make

Reference this migration of Example 1 for migrating your own calls:

```rust
contract
    .call(&worker, "ft_transfer")
    .args_json((alice.id(), transfer_amount, Option::<bool>::None))?
    .gas(300_000_000_000_000)
    .deposit(ONE_YOCTO)
    .transact()
    .await?;

let root_balance = contract
    .call(&worker, "ft_balance_of")
    .args_json((contract.id(),))?
    .view()
    .await?
    .json::<U128>()?;
```

:::note
Note that you have to pass arguments as any serializable type representing a sequential list. Tuples are usually the best candidate due to their heterogeneous nature (remember that you can construct a unary tuple by placing a comma before the closing bracket like this: `(el,)`).
:::

### Batched transactions

There is a special builder for making batch transactions that can be instantiated by calling `Contract::batch`. Consider the following snippet making a batch transaction consisting of two calls:

```rust title="Batch Transaction - near-sdk-sim"
root
    .create_transaction(contract.account_id())
    .function_call(
        "ft_transfer_call".to_string(),
        json!({
            "receiver_id": defi_contract.account_id(),
            "amount": transfer_amount.to_string(),
            "msg": "10",
        })
        .to_string()
        .into_bytes(),
        300_000_000_000_000 / 2,
        1,
    )
    .function_call(
        "storage_unregister".to_string(),
        json!({
            "force": true
        })
        .to_string()
        .into_bytes(),
        300_000_000_000_000 / 2,
        1,
    )
    .submit();
```

There are no caveats here, the snippet can be straightforwardly mapped into the following:

```rust title="Batch Transaction - workspace-rs"
contract
    .batch(&worker)
    .call(
        Function::new("ft_transfer_call")
            .args_json((defi_contract.id(), transfer_amount, Option::<String>::None, "10"))?
            .gas(300_000_000_000_000 / 2)
            .deposit(1),
    )
    .call(
        Function::new("storage_unregister")
            .args_json((Some(true),))?
            .gas(300_000_000_000_000 / 2)
            .deposit(1),
    )
    .transact()
    .await?;
```

## Inspecting logs

TBD

## Profiling gas

TBD
