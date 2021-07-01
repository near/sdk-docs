---
sidebar_position: 2
---

# Collections

When deciding on data structures to use for the data of the application, it is important to minimize the amount of data read and written to storage but also the amount of data serialized and deserialized to minimize the cost of transactions. It is important to understand the tradeoffs of data structures in your smart contract because it can become a bottleneck as the application scales and migrating the state to the new data structures will come at a cost.

The collections within `near-sdk` are designed to split the data into chunks and defer reading and writing to the store until needed. These data structures will handle the low-level storage interactions and aim to have a similar API to the [`std::collections`](https://doc.rust-lang.org/std/collections/index.html).

> Note: The `near_sdk::collections` will be moving to `near_sdk::store` and have updated APIs. If you would like to access these updated structures as they are being implemented, enable the `unstable` feature on `near-sdk`.

It is important to keep in mind that when using `std::collections`, that each time state is loaded, all entries in the data structure will be read eagerly from storage and deserialized. This will come at a large cost for any non-trivial amount of data, so to minimize the amount of gas used the SDK collections should be used in most cases.

The most up to date collections and their documentation can be found [in the rust docs](https://docs.rs/near-sdk/latest/near_sdk/collections/index.html).
<!-- TODO include/update link for store module to replace collections mod when docs updated -->

The following data structures that exist in the SDK are as follows:

| SDK collection      | `std` equivalent | Description |
| ------------------- | ---------------- | ------------|
| `LazyOption<T>`     | `Option<T>`      | Optional value in storage. This value will only be read from storage when interacted with. This value will be `Some<T>` when the value is saved in storage, and `None` if the value at the prefix does not exist. |
| `Vector<T>`         | `Vec<T>`         | A growable array type. The values are sharded in memory and can be used for iterable and indexable values that are dynamically sized. |
| `LookupMap<K, V>`   | `HashMap<K, V>`  | This structure behaves as a thin wrapper around the key-value storage available to contracts. This structure does not contain any metadata about the elements in the map, so it is not iterable. |
| `UnorderedMap<K, V>`| `HashMap<K, V>`  | Similar to `LookupMap`, except that it stores additional data to be able to iterate through elements in the data structure. |
| `TreeMap<K, V>`     | `BTreeMap<K, V>` | An ordered equivalent of `UnorderedMap`. The underlying implementation is based on an [AVL tree](https://en.wikipedia.org/wiki/AVL_tree). This structure should be used when a consistent order is needed or accessing the min/max keys is needed. |
| `LookupSet<T>`      | `HashSet<T>`     | A set, which is similar to `LookupMap` but without storing values, can be used for checking the unique existence of values. This structure is not iterable and can only be used for lookups. |
| `UnorderedSet<T>`   | `HashSet<T>`     | An iterable equivalent of `LookupSet` which stores additional metadata for the elements contained in the set. |


<!-- TODO Prevent users from abusing each other by hashing collection keys -->
