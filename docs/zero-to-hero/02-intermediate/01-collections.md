---
sidebar_position: 2
sidebar_label: "Store multiple puzzles"
title: "Store multiple crossword puzzles using a specialized collection in NEAR called a LookupMap"
---

# Using collections

As mentioned in the previous chapter, the [online Rust Book](https://doc.rust-lang.org/stable/book) is a great reference for folks getting started with Rust, but there are concepts that differ when we're dealing with the blockchain. One of these differences is the use of collections.

The reference-level documentation of the Rust SDK explains this concept well:

:::note  Motivation for specialized collections
>Collections that offer an alternative to standard containers from [Rust's] std::collections::* by **utilizing the underlying blockchain trie storage more efficiently**.<br/>
>For example, the following smart contract does not work with state efficiently, because **it will load the entire HashMap at the beginning of the contract call**, and will save it entirely at the end, in cases when there is state modification. **This is fine for small number of elements, but very inefficient for large numbers**.

— [NEAR SDK reference documentation](https://docs.rs/near-sdk/latest/near_sdk/collections/index.html)
:::

In chapter 1, we set the crossword puzzle solution hash when we first deployed the contract and called the initialization method `new`, passing it. This would only allow us to have only one puzzle, but let's allow for many.

At a high level, let's discuss what we'll want to add if our contract is to store multiple crossword puzzles. First, we'll have the concept of many puzzles where some of them will have different states (unfinished and finished) and we'll want to know which ones are unsolved in quick way. Another thing, which is a general rule of thumb when writing smart contracts, is to anticipate what might happen if it gets a lot of usage. What if we end up with 10,000 crossword puzzles? How might that affect how many data structures we use and which ones?

## LookupMap and UnorderedSet

Let's try having two specialized NEAR collections:

1. A [LookupMap](https://docs.rs/near-sdk/latest/near_sdk/collections/struct.LookupMap.html) which will store key-value pairs. (Solution hash » Puzzle object)
2. An [UnorderedSet](https://docs.rs/near-sdk/latest/near_sdk/collections/struct.UnorderedSet.html) containing a set (list with no duplicates) of the solution hashes for puzzles which have not been solved yet.

As you look at the list of specialized collections in the Rust SDK, you might notice some begin with `Lookup` while others have `Unordered`. As is written in the reference documentation, the `Lookup` is non-iterable while the `Unordered` collections are iterable. This means if you will need to loop through the list of contents of this data structure, you'll likely use an iterable data structure. If you'll only ever be adding and retrieving data by the key, and the key will always be known, it's more efficient to use a non-iterable collection.

So why would we have two data structures here? Again, if we end up with a large number of puzzles, we might not be able to loop through all the puzzles, looking for ones that are unsolved. Because of the limit of gas execution per transaction, we must be conscious that there can be operations which will eventually exceed this limit. I suppose we could assume  that our `UnorderedSet` of unsolved puzzles wouldn't contain tens of thousands of puzzles. That's one way to avoid running into limits, but we could also learn how to utilize **pagination** through an iterable collection like an `UnorderedSet` which we'll get to later.

As we remember from the previous chapter, every smart contract has a primary struct containing the `#[near_bindgen]` macro. Here's how our struct will look with the iterable and non-iterable NEAR collections:

```rust reference
https://github.com/near-examples/crossword-tutorial-chapter-2/blob/7736b2d1b368722bca52cf9411bd66d57e15da79/contract/src/lib.rs#L75-L80
```

:::note Naming the primary struct
Note in the [previous chapter](/zero-to-hero/basics/set-up-skeleton#start-writing-rust) we named our primary struct `Contract`, but in the snippet above it's called `Crossword.` What's going on?

The name of the struct doesn't matter and there's nothing special about naming it `Contract`, though you might see that convention used in several smart contracts on NEAR. We've named it something different simply to illustrate that there's no magic behind the scenes. This *does* mean, however, that our `impl` block will also use `Crossword`.
:::

The snippet below shows the first method in the implementation of the `Crossword` struct, where the `new` function sets up these two specialized collections.

```rust reference
https://github.com/near-examples/crossword-tutorial-chapter-2/blob/7736b2d1b368722bca52cf9411bd66d57e15da79/contract/src/lib.rs#L82-L90
```

## Collections have prefixes

Above, the `new` function is initializing the struct's fields by giving them a unique prefix. You can learn more about [the prefixes here](/contract-structure/nesting#traditional-approach-for-unique-prefixes), but know that these prefixes (`c` and `u`) should be short and different.

Let's take a peek at how we'll add a new crossword puzzle. Note that there will be a new struct here, `Answer`, which we haven't defined yet. We'll also be introducing the concept of enums, like `PuzzleStatus::Solved` and `PuzzleStatus::Unsolved`. We'll be covering these in the next section.

Unlike the previous chapter where there was only one crossword puzzle, we'll be inserting into our new collections.

```rust reference
https://github.com/near-examples/crossword-tutorial-chapter-2/blob/7736b2d1b368722bca52cf9411bd66d57e15da79/contract/src/lib.rs#L146-L161
```

Now we're set up to store multiple puzzles! Let's dive into structs and enums next.