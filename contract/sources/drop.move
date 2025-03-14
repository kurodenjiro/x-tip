module DropAddress::DropContract {
    use aptos_framework::coin;
    use aptos_framework::signer;
    use std::vector;
    use std::option;
    use aptos_framework::aptos_coin::AptosCoin;

    /// Struct to store drop details
    struct Drop has key, store ,drop {
        owner: address,
        recipient: address,
        amount: u64,
        claimed: bool,
    }

    /// Resource to manage all drops for an owner
    struct DropStore has key, store {
        drops: vector<Drop>,
    }

    /// Initialize DropStore for an account
    public entry fun init(account: &signer) {
        let owner = signer::address_of(account);
        move_to(account, DropStore { drops: vector::empty<Drop>() });
    }

    /// Create a drop for a specific recipient
    public entry fun create_drop(account: &signer, recipient: address, amount: u64) acquires DropStore{
        let owner = signer::address_of(account);
        let drop_store = borrow_global_mut<DropStore>(owner);

        // Transfer funds from owner to the contract owner (e.g., self storage)
        coin::transfer<AptosCoin>(account, owner, amount); // Transfer funds from sender to itself
        
        // Store drop details
        vector::push_back(&mut drop_store.drops, Drop {
            owner,
            recipient,
            amount,
            claimed: false,
        });
    }

    /// Claim a drop with a withdrawal address
    public entry fun claim_drop(account: &signer, owner: address, withdraw_to: address) acquires DropStore{
        let recipient = signer::address_of(account);
        let drop_store = borrow_global_mut<DropStore>(owner);

        let i = 0;
        let found = false;
        let amount = 0;
        
        while (i < vector::length(&drop_store.drops)) {
            let drop_ref = &mut drop_store.drops[i];

            if (drop_ref.owner == owner && drop_ref.recipient == recipient && !drop_ref.claimed) {
                amount = drop_ref.amount;
                drop_ref.claimed = true;
                found = true;
                break;
            };
            i = i + 1;
        };
        if (found) {
            let drop_instance = vector::remove(&mut drop_store.drops, i);
            // Explicitly handle the drop_instance if necessary
            // For example, logging or performing cleanup actions
            // After handling, it will be automatically dropped when it goes out of scope
            // Check if the recipient has a CoinStore for AptosCoin
            if (!coin::is_account_registered<aptos_framework::aptos_coin::AptosCoin>(withdraw_to)) {
                // Register CoinStore for AptosCoin
                coin::register<aptos_framework::aptos_coin::AptosCoin>(account);
            };
            coin::transfer<aptos_framework::aptos_coin::AptosCoin>(account, withdraw_to, amount); // Transfer funds to withdrawal address
        } else {
            abort 1; // No valid drop found
        }
    }

    /// Revoke an unclaimed drop
    public entry fun revoke_drop(account: &signer, recipient: address) acquires DropStore {
        let owner = signer::address_of(account);
        let drop_store = borrow_global_mut<DropStore>(owner);

        let i = 0;
        let amount = 0;
        let found = false;
        while (i < vector::length(&drop_store.drops)) {
            let drop_ref = &mut drop_store.drops[i];

            if (drop_ref.owner == owner && drop_ref.recipient == recipient && !drop_ref.claimed) {
                amount = drop_ref.amount;
                found = true;
                break;
            };
            i = i + 1;
        };
        if (found) {
            // Explicitly handle the Drop instance before removal
            let drop_instance = vector::remove(&mut drop_store.drops, i);
            // Now, drop_instance can be used or its resources managed as needed
            // For example, logging or performing cleanup actions
            // After handling, it will be automatically dropped when it goes out of scope
        };
        if (amount > 0) {
            coin::transfer<AptosCoin>(account, owner, amount); // Refund to the owner
        }
    }
}
