---
sidebar_position: 2
---

# Simulation Tests

**Note**: simulation tests are being deprecated in favor of [the Sandbox](https://docs.near.org/docs/develop/contracts/sandbox). Until the Sandbox is ready, simulation tests are still a useful approach to the types of testing described on this page. Please note, however, that there will not be ongoing development for it.  

## Unit tests vs. simulation tests

Unit tests are great for ensuring that functionality works as expected. This might include checking that function `get_nth_fibonacci(n: u8)` works as expected, handles invalid input gracefully, etc. Unit tests in smart contracts might similarly test public functions, but can get unruly if there are several calls between accounts. As mentioned in the [unit tests](unit-tests.md) section, there is a `VMContext` object used by unit tests to mock some aspects of a transaction. One might, for instance, modify the testing context to have the `predecessor_account_id` of `"bob.near"`. The limits of unit tests become obvious with certain interactions, like transferring tokens. Since `"bob.near"` is simply a string and not an account object, there is no way to write a unit test that confirms that Alice sent Bob 6 NEAR (Ⓝ). Furthermore, there is no way to write a unit test that executes cross-contract calls.

Simulation tests provide the ability to have (mocked) end-to-end testing that includes cross-contract calls, proper user accounts, access to state, structured execution outcomes, and more. It should be noted that simulation tests are not a one-to-one match with the behavior of nodes, but still offers significantly improved features to unit tests. (The Sandbox aims to offer the same behavior as real nodes, with the ability to patch state and more.)  

## When to use simulation tests

You'll probably want to use simulation tests when:
- there are cross-contract calls
- there are multiple contracts that interact
- there are multiple users whose balance changes
- you're writing something that "feels" like an [end-to-end test](https://www.testim.io/blog/end-to-end-testing-guide)

## Setup

Unlike unit tests (which often live in the `src/lib.rs` file of the contract), simulation tests are conventionally in a separate subdirectory of the contract called `tests`. Refer to this folder structure below:

```sh
├── Cargo.toml
├── src
│  └── lib.rs         ⟵ contract code
├── target
└── tests             ⟵ simulation test directory
   └── sim            ⟵ optional directory for convention
      └── main.rs     ⟵ simulation test file
```

The `main.rs` file above will contain the simulation tests. These will be run alongside the other tests using the typical test command:

    cargo test -- --nocapture

:::note
You may also run the simpler command `cargo test`, but the one above will allow for messages to appear on the terminal, such as logs and print lines. <a href="https://doc.rust-lang.org/cargo/commands/cargo-test.html#display-options" target="_blank">More info here</a>.
:::

## Comparing an example

### Unit test

Let's take a look at a very simple unit test and simulation test that accomplish the same thing. Normally you wouldn't duplicate efforts like this, but it will be informative.

One of the simple examples on the <a href="https://near.dev" target="_blank">NEAR Examples landing page</a> is the <a href="https://examples.near.org/rust-counter" target="_blank">Rust counter</a>. We'll be using snippets from this repository to demonstrate simulation tests.

First, note this unit test that tests the functionality of the `increment` method:

```rust reference
https://github.com/near-examples/rust-counter/blob/dad0cfd918fcc4c25611307aa07ad377b97ea52b/contract/src/lib.rs#L128-L139
```

The test above sets up the testing context, instantiates the smart contract's struct called `Counter`, calls the `increment` method, and makes an assertion that a number field on the struct is now `1`.

Let's look at how this might be written with simulation tests. The snippet below is a bit longer as it demonstrates a couple of things worth noting.

### Simulation test

```rust reference
https://github.com/near-examples/rust-counter/blob/8fdffcd780c3dff8d84aa54c774dfbca66ad8289/contract/tests/sim/main.rs#L12-L64
```

In the simulation above, we initialize the simulator, getting a `root` account. Then the compiled smart contract for the Rust Counter example is deployed to a simulation environment. This environment does not persist between testing and offers a similar environment to how a NEAR network node interacts. Next we see calls to a view and change method (with the `view!` and `call!` macros) along with an assertion checking the expected value.

Above halfway down the simulation test we'll see another approach to a view and change method that doesn't use macros. (These begin with `root.call` and `root.view`.) The choice between using the macro or non-macro approach is stylistic. The <a href="https://examples.near.org/FT" target="_blank">fungible token example</a> is a great reference for <a href="https://github.com/near-examples/FT/blob/master/tests/sim/with_macros.rs" target="_blank">the macro</a> and <a href="https://github.com/near-examples/FT/blob/master/tests/sim/no_macros.rs" target="_blank">non-macro</a> approaches to testing.

Please visit the <a href="https://docs.rs/near-sdk-sim/latest/near_sdk_sim" target="_blank">crate reference documentation</a> for details on the available methods with simulation testing.

:::info
**Pitfall**: you must compile your contract before running simulation tests. Because sim tests use the Wasm binary, if changes are made to the smart contract code it will not automatically be tested against.
:::

## Use contract in simulation test

:::info
**Quirk**: behind the scenes, simulation tests will create an import object using Pascal casing. The format is **StructnameContract**. A number of smart contracts call their primary struct (the one decorated with [#[near_bindgen]](/contract-structure/near-bindgen)) `Contract`. Hence the Pascal case object becomes ContractContract.
:::

Contracts like this will often assign a different name as shown below:

```rust reference
https://github.com/near-examples/NFT/blob/95f4b02f7437389b26c9f5889bda272099c52b76/tests/sim/utils.rs#L3
```

We'll finish this page with some helpful examples demonstrating various aspects of simulation testing.

## Helpful snippets

### Create a simulated user account

```rust reference
https://github.com/near-examples/NFT/blob/95f4b02f7437389b26c9f5889bda272099c52b76/tests/sim/utils.rs#L75
```

### Using a custom genesis config

```rust reference
https://github.com/near/near-sdk-rs/blob/ca9082e786f6b0f075bab59a033f873e7f0ebc7f/examples/cross-contract-high-level/tests/general.rs#L15-L18
```

### Working with execution outcomes

This sets the variable `res` to be the execution result of a change method. It also demonstrates unwrapping a value from the call. Note that besides `unwrap_json` there is also `unwrap_borsh` and `unwrap_json_value` which may be useful. 

```rust reference
https://github.com/near/near-sdk-rs/blob/ca9082e786f6b0f075bab59a033f873e7f0ebc7f/examples/cross-contract-low-level/tests/general.rs#L95-L98
```

### Failed execution results

A helpful utility function to check if an execution result has failed. This does not give insight into the error message itself.

```rust reference
https://github.com/near-daos/sputnik-dao-contract/blob/d2819811ddde08c32592d484804b410348dd81ce/sputnikdao2/tests/utils/mod.rs#L30-L35
```

### More detailed failed execution result

While not ideal (as it looks for a substring) this is a method to identify a particular error that's thrown.

```rust reference
https://github.com/Cron-Near/contracts/blob/35f91961e46b249b5ab577a01d394fc7cb2a6099/manager/tests/sim/main.rs#L149-L172
```

### Producing blocks to "move forward" in time

This example (and particularly the entire test) shows how one might produce blocks using simulation tests. This may be useful if a contract is supposed to act differently based on block height. As mentioned earlier in this page, simulation tests will be deprecated, so the syntax may be a bit odd for this use case.

```rust reference
https://github.com/Cron-Near/contracts/blob/35f91961e46b249b5ab577a01d394fc7cb2a6099/manager/tests/sim/main.rs#L89-L100
```
