---
sidebar_position: 3
---

# DAO-Governed Updates

When you first deploy a contract to [mainnet](https://docs.near.org/docs/concepts/networks), you will likely keep control of a [Full Access key](https://docs.near.org/docs/concepts/account#access-keys) for the contract. This puts the contract in "trusted" mode, in which you and other maintainers can change it at-will (which means your users need to trust you to not steal their funds, change their votes, or otherwise behave maliciously). This is fine for early-stage contracts & apps, but like any blockchain, NEAR allows you to do better.

When you're ready, you can remove all Full Access keys controlled by individuals, and give only another contract full access to its code _[TODO: is this the way it works? Alternatively, can you remove ALL Full Access keys?]_

Then the contract can implement two main methods:

1. A method to store a proposed new version of the contract (as Wasm bytes, in an inspectable way so DAO members can verify that the bytes match a specific change to the source code)
2. Another method to actually deploy the proposed new version

You could structure it so that anyone can propose changes, but the actual deploy will only be called after [DAO](https://whiteboardcrypto.com/what-is-a-dao/) members vote to approve the upgrade.

Here's [how Ref Finance does this](https://github.com/ref-finance/ref-contracts/blob/b3aa78e83f2459017c9301d1f1b8d1ba8bcf6e7e/ref-exchange/src/owner.rs#L52-L107), [how SputnikDAO does it](https://github.com/near-daos/sputnik-dao-contract/blob/317ea4fb1e6eac8064ef29a78054b0586a3406c3/sputnikdao2/src/types.rs#L114-L142), and some [other tips](https://hackmd.io/_UMem3SNSAeIqQASlRZahg).

That's all we have for now! This page is a stub. Sorry about that. Can you help?
