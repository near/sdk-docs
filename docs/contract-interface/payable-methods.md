---
sidebar_position: 4
---

# Payable Methods

We can allow methods to accept token transfer together with the function call. This is done so that contracts can define a fee in tokens that needs to be payed when they are used. By the default the methods are not payable and they will panic if someone will attempt to transfer tokens to them during the invocation. This is done for safety reason, in case someone accidentally transfers tokens during the function call.

To declare a method as payable, use the `#[payable]` annotation within the [`near_bindgen` macro](../contract-structure/near-bindgen.md) as follows:

```rust
#[payable]
pub fn my_method(&mut self) {
...
}
```

And this will allow the `my_method` function to be called and transfer balance to the contract.
