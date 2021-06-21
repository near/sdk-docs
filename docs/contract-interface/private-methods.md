---
sidebar_position: 3
---

# Private Methods

Usually, when a contract has to have a callback for a remote cross-contract call, this callback method should only be called by the contract itself. It's to avoid someone else calling it and messing the state. Pretty common pattern is to have an assert that validates that the direct caller (predecessor account ID) matches to the contract's account (current account ID). Macro `#[private]` simplifies it, by making it a single line macro instead and improves readability.

Use this annotation within the [`near_bindgen` macro](../contract-structure/near-bindgen.md) as follows:

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

