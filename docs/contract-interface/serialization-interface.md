---
sidebar_position: 5
---

# Serialization Protocols

Serialization formats within the SDK define how data structures are translated into bytes which are needed for passing data into methods of the smart contract or storing data in state. For the case of method parameters, [JSON](https://www.json.org/json-en.html) (default) and [Borsh](https://borsh.io/) are supported with the SDK and for storing data on-chain Borsh is used.

The qualities of JSON and Borsh are as follows:

JSON:
- Human readable
- Self-describing format (don't need to know the underlying type)
- Easy interop with JavaScript
- Less efficient size and (de)serialization

Borsh:
- Compact, binary format that's efficient for serialized data size
- Need to know data format or have a schema to deserialize data
- Strict and canonical binary representation
- Fast and less overhead in most cases

In general, JSON will be used for contract calls and cross-contract calls for a better DevX, where Borsh can be used to optimize using less gas by having smaller parameter serialization and less deserialization computation within the contract.

### Overriding Serialization Protocol Default

The result and parameter serialization can be opted into separately, but all parameters must be of the same format (can't serialize some parameters as borsh and others as JSON). An example of switching both the result and parameters to borsh is as follows:

```rust
#[result_serializer(borsh)]
pub fn sum_borsh(#[serializer(borsh)] a: u32, #[serializer(borsh)] b: u32) -> u32 {
    a + b
}
```

Where the `result_serializer(borsh)` annotation will override the default result serialization protocol from JSON to borsh and the `serializer(borsh)` annotations will override the parameter serialization.

#### Example

A simple demonstration of getting a [Borsh-serialized](https://borsh.io), base64-encoded value from a unit test:

```rust reference
https://github.com/mikedotexe/rust-status-message/blob/03781079d1716584d114bec294de00f5336cd20d/src/lib.rs#L106-L114
```

The following snippet shows a simple function that takes this value from a frontend or CLI. Note: this method doesn't have a return value, so the `#[result_serializer(borsh)]` isn't needed.

```rust reference
https://github.com/mikedotexe/rust-status-message/blob/03781079d1716584d114bec294de00f5336cd20d/src/lib.rs#L41-L54
```

To call this with NEAR CLI, use a command similar to this:

    near call rust-status-message.demo.testnet set_status_borsh --base64 'DAAAAEFsb2hhIGhvbnVhIQ==' --accountId demo.testnet

See more details in [this GitHub gist](https://gist.github.com/mfornet/d8a94af333a68d67affd8cb78464c7c0) from [Marcelo](https://twitter.com/mfornet94).

### JSON wrapper types

To help with serializing certain types to JSON which have unexpected or inefficient default formats, there are some wrapper types in [`near_sdk::json_types`](https://docs.rs/near-sdk/3.1.0/near_sdk/json_types/index.html) that can be used.

Because JavaScript only supports integers to value `2^53 - 1`, you will lose precision if deserializing the JSON integer is above this range. To counteract this, you can use the `I64`, `U64`, `I128`, and `U128` in place of the native types for these parameters or result to serialize the value as a string. By default, all integer types will serialize as an integer in JSON.

Another example of a type you may want to override the default serialization of is `Vec<u8>` which represents bytes in Rust. By default, this will serialize as an array of integers, which is not compact and very hard to use. There is a wrapper type [`Base64VecU8`](https://docs.rs/near-sdk/3.1.0/near_sdk/json_types/struct.Base64VecU8.html) which serializes and deserializes to a [Base-64](https://en.wikipedia.org/wiki/Base64) string for more compact JSON serialization.

Although there are these JSON wrapper types included with the SDK, any custom type can be used, as long as it implements [`serde`](https://serde.rs/) serialize and deserialize respectively. All of these types just override the JSON format and will have a consistent `borsh` serialization and deserialization as the inner types.
