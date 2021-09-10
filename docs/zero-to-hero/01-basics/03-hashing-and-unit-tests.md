---
sidebar_position: 4
sidebar_label: "Hashing the solution, add unit tests"
title: "Introduction to basic hashing and adding unit tests"
---

# Hash the solution, add basic unit tests

In the previous section, we stored the crossword solution as plain text as a `String` type on the smart contract. If we're trying to hide the solution from the users, this isn't a great approach as it'll be public to anyone looking at the state. Let's instead hash our crossword solution and store the hash. There are different ways to hash data, but let's use `sha256` which is one of the hashing algorithms available in [the Rust SDK](https://docs.rs/near-sdk/latest/near_sdk/env/fn.sha256.html).

:::info Remind me about hashing
Without getting into much detail, hashing is a "one-way" function that will output a result from a given input. If you have input (in our case, the crossword puzzle solution) you can get a hash, but if you have a hash you cannot get the input. This basic idea is foundational to information theory and security.

Later on in this tutorial, we'll switch from using `sha256` to using cryptographic key pairs to illustrate additional NEAR concepts.

Learn more about hashing from [Evgeny Kapun](https://github.com/abacabadabacaba)'s presentation on the subject. You may find other NEAR-related videos from the channel linked in the screenshot below.

[![Evgeny Kapun presents details on hashing](../assets/kapun-hashing.png)](https://youtu.be/PfabikgnD08)
:::

## Helper unit test during rapid iteration

As mentioned in the first section of this **Basics** chapter, our smart contract is technically a library as defined in the manifest file. For our purposes, a consequence of writing a library in Rust is not having a "main" function that runs. You may find many online tutorials where the command `cargo run` is used during development. We don't exactly have this luxury, but we can use unit tests to interact with our smart contract. This is likely more convenient than building the contract, deploying to a blockchain network, and calling a method.

Let's write a unit test that acts as a helper during development. This unit test will sha256 hash the input **"near nomicon ref finance"** and print it in a human-readable, hex format.

:::tip A note on the upcoming code
The following code may look a bit unusual or advanced. Don't worry if you don't understand it at this time. For those who are curious, it uses [formatting traits](https://doc.rust-lang.org/std/fmt/#formatting-traits) and [iterators](https://doc.rust-lang.org/book/ch13-02-iterators.html).
:::

```rust reference
https://github.com/mikedotexe/crossword-snippets/blob/8f413c4c7b2327aeb8b8a8c1204796bc704bdf2c/src/lib.rs#L56-L69
```

Run the unit tests with the command:

    cargo test -- --nocapture

You'll see this output:

```
…
running 1 test
Let's debug: "69C2FEB084439956193F4C21936025F14A5A5A78979D67AE34762E18A7206A0F"
test tests::debug_get_hash ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

This means that when you sha256 the input "near nomicon ref finance" it produces the hash `69C2FEB084439956193F4C21936025F14A5A5A78979D67AE34762E18A7206A0F`

:::tip Note on the test flags
You may also run tests using:

    cargo test

Note that the test command we ran had additional flags. Those flags told Rust *not to hide the output* from the tests. You can read more about this in [the cargo docs](https://doc.rust-lang.org/cargo/commands/cargo-test.html#display-options). Go ahead and try running the tests using the command above, without the additional flags, and note that we won't see the debug message.
:::

The unit test above is meant for debugging and quickly running snippets of code. Some may find this a useful technique when getting familiar with Rust and writing smart contracts. Next we'll write a real unit test that applies to this early version of our crossword puzzle contract.

## Write a regular unit test

Let's add this unit test and analyze it:

```rust reference
https://github.com/mikedotexe/crossword-snippets/blob/f77c6c026c3c7d06ffedb5d96ba083e47d4fd144/src/lib.rs#L69-L93
```

The first few lines of code will be used commonly when writing unit tests. It uses the `VMContextBuilder` to create some basic context for a transaction, then sets up the testing environment.

Next, an object is created representing the contract and the `set_solution` function is called. After that, the `guess_solution` function is called twice: first with the incorrect solution and then the correct one. We can check the logs to determine that the function is acting as expected.

:::info Note on assertions
This unit test uses the [`assert_eq!`](https://doc.rust-lang.org/std/macro.assert_eq.html) macro. Similar macros like [`assert!`](https://doc.rust-lang.org/std/macro.assert.html) and [`assert_ne!`](https://doc.rust-lang.org/std/macro.assert_ne.html) are commonly used in Rust. These are great to use in unit tests. However, these will add unnecessary overhead when added to contract logic, and it's recommended to use the [`require!` macro](https://docs.rs/near-sdk/4.0.0-pre.2/near_sdk/macro.require.html). See more information on this and [other efficiency tips here](/reducing-contract-size/examples).
:::

Again, we can run all the unit tests with:

    cargo test -- --nocapture

:::tip Run only one test
To only run this latest test, use the command:

    cargo test check_guess_solution -- --nocapture
:::