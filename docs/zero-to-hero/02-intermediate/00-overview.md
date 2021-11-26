---
sidebar_position: 1
sidebar_label: "Overview"
title: "Highlights of some intermediate topics covered."
---

import chapter2Correct from '../assets/chapter-2-solve.gif';

# Diving deeper

In the last chapter we installed Rust and got up and running with a simple smart contract. The contract has a few issues, however, and isn't as powerful as we'd like it to be. For instance, we can only store one crossword puzzle in the smart contract, the frontend is  hardcoded, and we don't offer any incentives to the person who wins.

In this chapter we'll:

- Allow the contract to store multiple crossword puzzles
- Store the positions of the clues in the contract
- Allow users to log in with a NEAR account
- Give a prize (in NEAR tokens) to the first person to solve the puzzle
- Explore using Rust structs and enums
- more…

<figure>
    <img src={chapter2Correct} width="600" alt="A user fills in the last clue in a crossword puzzle and an overlay appears saying that a transaction is pending" />
    <figcaption>A user solves the crossword puzzle, interacts with the blockchain, and gets a prize</figcaption>
</figure>

As we implement the list above, we'll learn key concepts about NEAR:

- [Actions](https://nomicon.io/RuntimeSpec/Actions.html)
- Full and function-call [access keys](https://docs.near.org/docs/concepts/account#access-keys)
- NEAR's specialized [Collections](https://docs.near.org/docs/concepts/data-storage#rust-collection-types) that are generally preferable to, say, Rust's standard HashMap 
- The flow of logging in to a decentralized app (dApp)
- more…

Let's jump right in!

## Completed project

Here's the final code for this chapter:

https://github.com/near-examples/crossword-tutorial-chapter-2
