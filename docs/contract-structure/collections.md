---
sidebar_position: 2
---

# Collections

When deciding on data structures to use for the data of the application, it is important to minimize the amount of data read and written to storage but also the amount of data serialized and deserialized to minimize the cost of transactions. It is important to understand the tradeoffs of data structures in your smart contract because it can become a bottleneck as the application scales and migrating the state to the new data structures will come at a cost.

The collections within `near-sdk` are designed to split the data into chunks and defer reading and writing to the store until needed. These data structures will handle the low level storage interactions and aim to have a similar API to the [`std::collections`](https://doc.rust-lang.org/std/collections/index.html).

> Note: The `near_sdk::collections` will be moving to `near_sdk::store` and have updated APIs. If you would like to access these updated structures, enable the `unstable` feature on `near-sdk`.

TODO

<!-- std vs near_sdk collections -->

<!-- Comparison table of collections and when to use each one -->

<!-- Prevent users from abusing each other by hashing collection keys -->
