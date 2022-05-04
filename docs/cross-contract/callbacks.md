---
sidebar_position: 2
---

# Callbacks

NEAR Protocol is a sharded, proof-of-stake blockchain that behaves differently than proof-of-work blockchains. When interacting with a native Rust (compiled to Wasm) smart contract, cross-contract calls are asynchronous. Callbacks are used to either get the result of a cross-contract call or tell if a cross-contract call has succeeded or failed.

There are two techniques to write cross-contract calls: [high-level](https://github.com/near/near-sdk-rs/blob/master/examples/cross-contract-calls/high-level/src/lib.rs) and [low-level](https://github.com/near/near-sdk-rs/blob/master/examples/cross-contract-calls/low-level/src/lib.rs). This document will mostly focus on the high-level approach. There are two examples in the Rust SDK repository that demonstrate these, as linked above. Note that these examples use cross-contract calls "to itself." We'll show two examples demonstrating the high-level approach.

## Calculator example

There is a helper macro that allows you to make cross-contract calls with the syntax `#[ext_contract(...)]`. It takes a Rust Trait and converts it to a module with static methods. Each of these static methods takes positional arguments defined by the Trait, then the `receiver_id`, the attached deposit and the amount of gas and returns a new `Promise`.

For example, let's define a calculator contract Trait:

```rust
#[ext_contract(ext_calculator)]
trait Calculator {
    fn mult(&self, a: U64, b: U64) -> U128;

    fn sum(&self, a: U128, b: U128) -> U128;
}
```

It's equivalent to the following code:

```rust
mod ext_calculator {
    pub fn mult(a: U64, b: U64, receiver_id: &AccountId, deposit: Balance, gas: Gas) -> Promise {
        Promise::new(receiver_id.clone())
            .function_call(
                b"mult",
                json!({ "a": a, "b": b }).to_string().as_bytes(),
                deposit,
                gas,
            )
    }

    pub fn sum(a: U128, b: U128, receiver_id: &AccountId, deposit: Balance, gas: Gas) -> Promise {
        // ...
    }
}
```

Let's assume the calculator is deployed on `calc.near`, we can use the following:

```rust
const CALCULATOR_ACCOUNT_ID: &str = "calc.near";
const NO_DEPOSIT: Balance = 0;
const BASE_GAS: Gas = 5_000_000_000_000;

#[near_bindgen]
impl Contract {
    pub fn sum_a_b(&mut self, a: U128, b: U128) -> Promise {
        let calculator_account_id: AccountId = CALCULATOR_ACCOUNT_ID.to_string();
        ext_calculator::sum(a, b, &calculator_account_id, NO_DEPOSIT, BASE_GAS)
    }
}
```

## Whitelist example

Next we'll look at a simple cross-contract call is made to a whitelist smart contract, returning whether an account is in the whitelist or not.

The common pattern with cross-contract calls is to call a method on an external smart contract, use `.then` syntax to specify a callback, and then retrieve the result or status of the promise. The callback will typically live inside the same, calling smart contract. There's a special macro used for the callback function, which is [#[private]](https://docs.rs/near-sdk-core/latest/near_sdk_core/struct.AttrSigInfo.html#structfield.is_private). We'll see this pattern in the example below.

The following example demonstrates two common approaches to callbacks using the high-level cross-contract approach. When writing high-level cross-contract calls, special [traits](https://doc.rust-lang.org/rust-by-example/trait.html) are set up as interfaces for the smart contract being called, and (typically) the current contract doing the calling (where callback logic will live). The second trait is, by convention, referred to as `ext_self`. Here are the two traits used in a simple example:

```rust reference
https://github.com/mikedotexe/cross-contract-view/blob/06bdb3222622c824b9f2fe0a53536e6914435580/src/lib.rs#L17-L26
```

After creating these traits, we'll show two simple functions that will make a cross-contract call to a whitelist smart contract, asking if the account `mike.testnet` is whitelisted. These methods will both return `true` using different approaches. First we'll look at the methods, then we'll look at the differences in callbacks. Note that for simplicity in this example, the values are hardcoded.

```rust
pub const XCC_GAS: Gas = 20000000000000;
fn get_whitelist_contract() -> AccountId {
    "whitelist.demo.testnet".to_string()
}
fn get_account_to_check() -> AccountId {
    "mike.testnet".to_string()
}
```

```rust reference
https://github.com/mikedotexe/cross-contract-view/blob/06bdb3222622c824b9f2fe0a53536e6914435580/src/lib.rs#L32-L52
```

The syntax begins with `ext_whitelist::is_whitelisted(…` showing that we're using the trait to call the method `is_whitelisted`. However, the trait shows only one argument, but we've included four. The last three arguments are used behind the scenes and represent:

1. The target smart contract account. (In this case, `whitelist.demo.testnet`.)
2. An attached deposit of Ⓝ, in yoctoⓃ. (1 Ⓝ = 1000000000000000000000000 yoctoⓃ.)
3. The amount of gas.

The two methods in the snippet above are very similar, except they will call separate callbacks in the smart contract, `callback_promise_result` and `callback_arg_macro`. 

```rust reference
https://github.com/mikedotexe/cross-contract-view/blob/06bdb3222622c824b9f2fe0a53536e6914435580/src/lib.rs#L56-L75
```

These two callbacks show how a value can be obtained. The first method gets the value from the promise result, while the second uses a macro on the argument to cast the value into what's desired. Please note that at this time, the second approach may not catch errors as well as the first approach. See [this issue](https://github.com/near/near-sdk-rs/issues/155) for more details.

The biggest difference between these two approaches is how the arguments are defined (or absent) in the traits shown earlier.

And that's it! Understanding how to make a cross-contract call and receive a result is an important part of developing smart contracts on NEAR. Two interesting references for using cross-contract calls can be found in the [fungible token](https://github.com/near-examples/FT) and [non-fungible token](https://github.com/near-examples/NFT) examples.
