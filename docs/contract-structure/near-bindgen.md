---
sidebar_position: 1
---

# near_bindgen

The `#[near_bindgen]` macro is used on a `struct` and the function implementations to generate the necessary code to be a valid NEAR contract and expose the intended functions to be able to be called externally.

For example, on a simple counter contract, the macro will be applied as such:

```rust
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::near_bindgen;

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, Default)]
pub struct Counter {
    value: u64,
}

#[near_bindgen]
impl Counter {
    pub fn increment(&mut self) {
        self.value += 1;
    }

    pub fn get_count(&self) -> u64 {
        self.value
    }
}
```

In this example, the `Counter` struct represents the smart contract state and anything that implements `BorshSerialize` and `BorshDeserialize` can be included, even `collections`, which will be covered in the next section. Whenever a function is called, the state will be loaded and deserialized, so it's important to keep this amount of data loaded as minimal as possible.

`#[near_bindgen]` also annotates the `impl` for `Counter` and this will generate any necessary boilerplate to expose the functions. The core interactions that are important to keep in mind:
- Any `pub` functions will be callable externally from any account/contract.
- Functions that take `&self` or `self` will be read-only and do not write the updated state to storage
- Functions that take `&mut self` allow for mutating state, and state will always be written back at the end of the function call
- If the function has a return value, it will be serialized and attached as a result through `env::value_return`

<!-- TODO include link to near_bindgen docs, when they aren't empty -->

## Initialization Methods

By default, the `Default::default()` implementation of a contract will be used to initialize a contract. There can be a custom initialization function which takes parameters or performs custom logic with the following `#[init]` annotation:

```rust
#[near_bindgen]
impl Counter {
    #[init]
    pub fn new(value: u64) -> Self {
	log!("Custom counter initialization!");
        Self { value }
  }
}
```

All contracts are expected to implement `Default`. If you would like to prohibit the default implementation from being used, the `PanicOnDefault` derive macro can be used:

```rust
#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct Counter {
    // ...
}
```

## Payable Methods

We can allow methods to accept token transfer together with the function call. This is done so that contracts can define a fee in tokens that needs to be payed when they are used. By the default the methods are not payable and they will panic if someone will attempt to transfer tokens to them during the invocation. This is done for safety reason, in case someone accidentally transfers tokens during the function call.

To declare a function as payable, use the `#[payable]` annotation as follows:
```rust
#[payable]
pub fn my_method(&mut self) {
...
}
```

And this will allow the `my_method` function to be called and transfer balance to the contract.

## Private Methods

Usually, when a contract has to have a callback for a remote cross-contract call, this callback method should only be called by the contract itself. It's to avoid someone else calling it and messing the state. Pretty common pattern is to have an assert that validates that the direct caller (predecessor account ID) matches to the contract's account (current account ID). Macro `#[private]` simplifies it, by making it a single line macro instead and improves readability.

```rust
#[private]
pub fn my_method(&mut self) {
...
}
```

Which is equivalent to:

```rust
pub fn my_method(&mut self ) {
    if env::current_account_id() != env::predecessor_account_id() {
        near_sdk::env::panic("Method method is private".as_bytes());
    }
...
}
```

Now with this annotation, only the account of the contract itself can call this method, either directly or through a promise.
