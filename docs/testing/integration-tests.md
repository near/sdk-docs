---
sidebar_position: 2
---

# Integration Tests

**Note:** Simulation tests are no longer actively supported. NEAR Simulator was meant to be an in-place replacement of a blockchain environment for the purpose of testing NEAR contracts. However, simulating NEAR ledger turned out to be a much more complex endeavour than was anticipated. Eventually, the idea of workspaces was born - a library for automating workflows and writing tests for NEAR smart contracts using a real NEAR network (localnet, testnet or mainnet). Thus, NEAR Simulator is being deprecated in favor of [`workspaces-rs`](https://github.com/near/workspaces-rs), the Rust edition of workspaces. As the two libraries have two vastly different APIs [this guide](workspaces-migration-guide.md) was created to ease the migration process for developers. 
 
## Unit Tests vs. Integration Tests

Unit tests are great for ensuring that functionality works as expected at an insolated, functional-level. This might include checking that function `get_nth_fibonacci(n: u8)` works as expected, handles invalid input gracefully, etc. Unit tests in smart contracts might similarly test public functions, but can get unruly if there are several calls between accounts. As mentioned in the [unit tests](unit-tests.md) section, there is a `VMContext` object used by unit tests to mock some aspects of a transaction. One might, for instance, modify the testing context to have the `predecessor_account_id` of `"bob.near"`. The limits of unit tests become obvious with certain interactions, like transferring tokens. Since `"bob.near"` is simply a string and not an account object, there is no way to write a unit test that confirms that Alice sent Bob 6 NEAR (Ⓝ). Furthermore, there is no way to write a unit test that executes cross-contract calls. Additionally, there is no way of profiling gas usage and the execution of the call (or set of calls) on the blockchain.

Integration tests provide the ability to have end-to-end testing that includes cross-contract calls, proper user accounts, access to state, structured execution outcomes, and more. In NEAR, we can make use of the `workspaces` libraries in both [Rust](https://github.com/near/workspaces-rs) and [JavaScript](https://github.com/near/workspaces-js) for this type of testing on a locally-run blockchain, testnet or mainnet.

## When to Use Integration Tests

You'll probably want to use integration tests when:

- There are cross-contract calls.
- There are multiple users with balance changes.
- You'd like to gather information about gas usage and execution outcomes on-chain.
- You want to assert the use-case execution flow of your smart contract logic works as expected.
- You want to assert given execution patterns do not work (as expected). 

## Setup

Unlike unit tests in Rust (which would often live in the `src/lib.rs` file of the contract), integration tests are conventionally in a separate subdirectory of the contract, with a name of your liking (such as `tests`). Refer to this folder structure below:

```sh
├── Cargo.toml
├── src
│  └── lib.rs         ⟵ contract code
├── target
└── tests             ⟵ integration test directory
   └── src            ⟵ optional directory for convention
      └── tests.rs    ⟵ integration test file
    Cargo.toml        ⟵ Cargo.toml file specifying run configuration
```

Notice we have 2 `Cargo.toml` files in this project. The first is the main `Cargo.toml` file which is used to specify the dependencies of the project, and the second which is used to specify the dependencies of the integration tests. A sample configuration for the integration tests is shown below:

```toml
[package]
name = "non-fungible-token-integration-tests"
version = "1.0.0"
publish = false
edition = "2018"

[dev-dependencies]
near-sdk = "4.0.0"
anyhow = "1.0"
borsh = "0.9"
maplit = "1.0"
near-units = "0.2.0"
# arbitrary_precision enabled for u128 types that workspaces requires for Balance types
serde_json = { version = "1.0", features = ["arbitrary_precision"] }
tokio = { version = "1.18.1", features = ["full"] }
tracing = "0.1"
tracing-subscriber = { version = "0.3.11", features = ["env-filter"] }
workspaces = "0.3.1"
pkg-config = "0.3.1"

[[example]]
name = "integration-tests"
path = "src/tests.rs"
```

The `tests.rs` file above will contain the integration tests, which will preserve state after each run if they are run in one file as in this setup. These can be run with the following command from the same level as the test `Cargo.toml` file:

    cargo run --example integration-tests

:::note
In case you wish for a new state for a test run, you can create an additional `.rs` file in `tests/src` which you can reference as an additional `[[example]]` in the `Cargo.toml` file. You would similarly run these tests with the following command:

    cargo run --example <name of the example>
:::

## Comparing an Example

### Unit Test

Let's take a look at a very simple unit test and integration test that accomplish the same thing. Normally you wouldn't duplicate efforts like this (as integration tests are intended to be broader in scope), but it will be informative.

One of the simple examples on the <a href="https://near.dev" target="_blank">NEAR Examples landing page</a> is the <a href="https://examples.near.org/rust-counter" target="_blank">Rust counter</a>. We'll be using snippets from this repository to demonstrate simulation tests.

First, note this unit test that tests the functionality of the `increment` method:

```rust reference
https://github.com/near-examples/rust-counter/blob/dad0cfd918fcc4c25611307aa07ad377b97ea52b/contract/src/lib.rs#L128-L139
```

The test above sets up the testing context, instantiates the smart contract's struct called `Counter`, calls the `increment` method, and makes an assertion that a number field on the struct is now `1`.

Let's look at how this might be written with workspaces tests. The snippet below is a bit longer as it demonstrates a couple of things worth noting.

### Workspaces Test

```rust reference
https://github.com/near-examples/rust-counter/blob/6a7af5a32c630e0298c09c24eab87267746552b2/integration-tests/rs/src/tests.rs#L6-L58
```

In the test above, we initialize the local blockchain environment with the `sandbox` constructor. Then the compiled smart contract `.wasm` file for the Rust Counter example is dev-deployed (newly created account) to the environment. The `root` account is fetched from the local environment later which is used to create accounts. This environment persists state between tests in this file and offers a similar environment to how a NEAR network node interacts. Next we see calls to a view and change method (with the `view!` and `call!` macros) along with an assertion checking the expected value. Tests are then listed sequentially, starting with the `increment` case.

Notice that the layout within `test_increment()`. Every `.call()` obtains its required gas from the account performing it. Unlike the unit test, there is no mocking being performed before the call as the context is provided by the environment initialized during `main()`. Every call interacts with this environment to either fetch or change state. 

:::info
**Pitfall**: you must compile your contract before running simulation tests. Because workspaces tests use the `.wasm` files to deploy the contracts to the network. If changes are made to the smart contract code, the smart contract wasm should be rebuilt before running these tests again.
:::

## Helpful Snippets

### Create an Account

```rust reference
https://github.com/near-examples/rust-counter/blob/6a7af5a32c630e0298c09c24eab87267746552b2/integration-tests/rs/src/tests.rs#L16-L21
```

### Create Helper Functions

```rust reference
https://github.com/near-examples/nft-tutorial/blob/7fb267b83899d1f65f1bceb71804430fab62c7a7/integration-tests/rs/src/helpers.rs#L148-L161
```

### Spooning - Pulling Existing State and Contracts from Mainnet/Testnet

This example showcases spooning state from a testnet contract into our local sandbox environment:

```rust reference
https://github.com/near/workspaces-rs/blob/c14fe2aa6cdf586028b2993c6a28240f78484d3e/examples/src/spooning.rs#L64-L122
```

For a full example, see the [examples/src/spooning.rs](https://github.com/near/workspaces-rs/blob/main/examples/src/spooning.rs) example.

### Fast Forwarding - Fast Forward to a Future Block

`workspaces` testing offers support for forwarding the state of the blockchain to the future. This means contracts which require time sensitive data do not need to sit and wait the same amount of time for blocks on the sandbox to be produced. We can simply just call `worker.fast_forward` to get us further in time:

```rust reference
https://github.com/near/workspaces-rs/blob/c14fe2aa6cdf586028b2993c6a28240f78484d3e/examples/src/fast_forward.rs#L12-L44
```

For a full example, take a look at [examples/src/fast_forward.rs](https://github.com/near/workspaces-rs/blob/main/examples/src/fast_forward.rs).

### Handle Errors

```rust reference
https://github.com/near-examples/FT/blob/98b85297a270cbcb8ef3901c29c17701e1cab698/integration-tests/rs/src/tests.rs#L199-L225
```

### Batch Transactions

```rust title="Batch Transaction - workspace-rs"
let res = contract
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

### Inspecting Logs

```rust title="Logs - workspaces-rs"
assert_eq!(
    res.logs()[1],
    format!("Closed @{} with {}", contract.id(), initial_balance.0 - transfer_amount.0)
);
```

Examining receipt outcomes: 

```rust title="Logs - workspaces-rs"
let outcome = &res.receipt_outcomes()[5];
assert_eq!(outcome.logs[0], "The account of the sender was deleted");
assert_eq!(outcome.logs[2], format!("Account @{} burned {}", contract.id(), 10));
```

### Profiling Gas

`CallExecutionDetails::total_gas_burnt` includes all gas burnt by call execution, including by receipts. This is exposed as a surface level API since it is a much more commonly used concept:

```rust title="Gas (all) - workspaces-rs"
println!("Burnt gas (all): {}", res.total_gas_burnt);
```

If you do actually want gas burnt by transaction itself you can do it like this:

```rust title="Gas (transaction) - workspaces-rs"
println!("Burnt gas (transaction): {}", res.outcome().gas_burnt);
```