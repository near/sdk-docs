---
sidebar_position: 1
---

# Advice & examples

This page is made for developers familiar with lower-level concepts who wish to reduce their contract size significantly, perhaps at the expense of code readability.

Some common scenarios where this approach may be helpful:

- contracts intended to be tied to one's account management
- contracts deployed using a factory
- future advancements similar to the EVM on NEAR

There have been a few items that may add unwanted bytes to a contract's size when compiled. Some of these may be more easily swapped for other approaches while others require more internal knowledge about system calls.

## Small wins

1. See the section in best practices on [creating smaller binaries](/best-practices#compile-smaller-binaries) using `opt-level` in the Cargo manifest.
2. Ensure that your manifest doesn't contain `rlib` unless it needs to. Some NEAR examples have included this:

  :::caution Possibly adds unnecessary bloat

  ```toml
  [lib]
  crate-type = ["cdylib", "rlib"]
  ```
  :::

  when it could be:

  :::tip

  ```toml
  [lib]
  crate-type = ["cdylib"]
  ```
  :::

3. When using the Rust SDK, you may override the default JSON serialization to use [Borsh](https://borsh.io) instead. [See this page](/contract-interface/serialization-interface#overriding-serialization-protocol-default) for more information and an example.
4. When using assertions or guards, avoid using the standard `assert` macros like [`assert!`](https://doc.rust-lang.org/std/macro.assert.html), [`assert_eq!`](https://doc.rust-lang.org/std/macro.assert_eq.html), or [`assert_ne!`](https://doc.rust-lang.org/std/macro.assert_ne.html) as these may add bloat for information regarding the line number of the error.

  Example of a standard assertion:

  :::caution Possibly adds unnecessary bloat

  ```rust
  assert_eq!(contract_owner, predecessor_account, "ERR_NOT_OWNER");
  ```
  :::

  when it could be:

  :::tip

  ```rust
  if contract_owner == predecessor_account {
    env::panic(b"ERR_NOT_OWNER");
  }
  ```
  :::

## Lower-level approach

For a `no_std` approach to minimal contracts, observe the following examples:

- [Tiny contract](https://github.com/near/nearcore/tree/master/runtime/near-test-contracts/tiny-contract-rs)
- [NEAR ETH Gateway](https://github.com/ilblackdragon/near-eth-gateway/blob/master/proxy/src/lib.rs)
- [This YouTube video](https://youtu.be/Hy4VBSCqnsE) where Eugene demonstrates a fungible token in `no_std` mode. The code for this [example lives here](https://github.com/near/core-contracts/pull/88).
- [Examples using a project called `nesdie`](https://github.com/austinabell/nesdie/tree/main/examples).
- Note that Aurora has found success using [rjson](https://crates.io/crates/rjson) as a lightweight JSON serialization crate. It has a smaller footprint than [serde](https://crates.io/crates/serde) which is currently packaged with the Rust SDK. See [this example of rjson](https://github.com/aurora-is-near/aurora-engine/blob/65a1d11fcd16192cc1bda886c62005c603189a24/src/json.rs#L254) in an Aurora repository, although implementation details will have to be gleaned by the reader and won't be expanded upon here. [This nesdie example](https://github.com/austinabell/nesdie/blob/bb6beb77e32cd54077ac54bf028f262a9dfb6ad0/examples/multisig/src/utils/json/vector.rs#L26-L30) also uses the [miniserde crate](https://crates.io/crates/miniserde), which is another option to consider for folks who choose to avoid using the Rust SDK.

:::note Information on system calls
<details>
  <summary>Expand to see what's available from <code>sys.rs</code></summary>

```rust reference
https://github.com/near/near-sdk-rs/blob/master/near-sdk/src/environment/sys.rs
```
</details>
:::
