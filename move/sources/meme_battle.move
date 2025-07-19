module gui_arena::meme_battle {  // Keep gui_arena, change module name
    use std::string::String;
    use std::vector;
    use std::option::Option;
    use std::signer;
    use std::error;
    use std::table::Table;
    use aptos_framework::timestamp;
    use aptos_framework::account::SignerCapability;
    use aptos_framework::event::EventHandle;
    use aptos_framework::object::Object;
    use aptos_framework::fungible_asset::Metadata;

    // $GUI Token Constants
    const GUI_DECIMALS: u8 = 8;
    const GUI_INITIAL_SUPPLY: u64 = 1_000_000_000_000_000; // 1B GUI tokens
    const GUI_VOTING_COST: u64 = 100_000_000; // 1 GUI per vote
    const GUI_SUBMISSION_STAKE: u64 = 1_000_000_000; // 10 GUI to submit
    const GUI_WINNER_REWARD: u64 = 5_000_000_000; // 50 GUI winner reward

    // Error codes
    const E_NOT_ADMIN: u64 = 1;
    const E_TOURNAMENT_NOT_FOUND: u64 = 2;
    const E_ALREADY_SUBMITTED: u64 = 3;
    const E_VOTING_ENDED: u64 = 4;
    const E_CANNOT_VOTE_OWN_SUBMISSION: u64 = 5;
    const E_INSUFFICIENT_GUI_TOKENS: u64 = 6;

    // Tournament states
    const TOURNAMENT_ACTIVE: u8 = 1;
    const TOURNAMENT_VOTING: u8 = 2;
    const TOURNAMENT_ENDED: u8 = 3;

    // Core data structures
    struct Submission has store {
        creator: address,
        title: String,
        ipfs_hash: String,
        votes: u64,
        gui_earned: u64,
    }

    struct Tournament has store {
        id: u64,
        title: String,
        creator: address,
        start_time: u64,
        end_time: u64,
        voting_end_time: u64,
        state: u8,
        submissions: Table<address, Submission>,
        participant_addresses: vector<address>,
        winner: Option<address>,
        total_prize_pool: u64,
    }

    struct PlatformState has key {
        admin: address,
        tournament_counter: u64,
        tournaments: Table<u64, Tournament>,
        gui_token_metadata: Object<Metadata>,
        fee_collector: address,
        fee_collector_cap: SignerCapability,
    }

    struct PlatformEvents has key {
        tournament_created_events: EventHandle<TournamentCreated>,
        meme_submitted_events: EventHandle<MemeSubmitted>,
        vote_cast_events: EventHandle<VoteCast>,
        winner_announced_events: EventHandle<WinnerAnnounced>,
    }

    // Event structures
    struct TournamentCreated has drop, store {
        tournament_id: u64,
        title: String,
        creator: address,
    }

    struct MemeSubmitted has drop, store {
        tournament_id: u64,
        creator: address,
        title: String,
        ipfs_hash: String,
    }

    struct VoteCast has drop, store {
        tournament_id: u64,
        voter: address,
        submission_creator: address,
        gui_spent: u64,
    }

    struct WinnerAnnounced has drop, store {
        tournament_id: u64,
        winner: address,
        gui_prize: u64,
    }

    // Initialize the platform
    fun init_module(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        
        // Create fee collector account
        let (fee_collector, fee_collector_cap) = aptos_framework::account::create_resource_account(admin, b"gui_arena_fees");
        let fee_collector_addr = signer::address_of(&fee_collector);

        // Create $GUI token
        let constructor_ref = aptos_framework::object::create_named_object(admin, b"GUI_TOKEN");
        aptos_framework::primary_fungible_store::create_primary_store_enabled_fungible_asset(
            &constructor_ref,
            std::option::none(),
            std::string::utf8(b"GUI Arena Token"),
            std::string::utf8(b"GUI"),
            GUI_DECIMALS,
            std::string::utf8(b"https://gui-arena.com/token-icon.png"),
            std::string::utf8(b"https://gui-arena.com"),
        );

        let gui_token_metadata = aptos_framework::object::object_from_constructor_ref<Metadata>(&constructor_ref);
        
        // Mint initial supply to admin
        let mint_ref = aptos_framework::fungible_asset::generate_mint_ref(&constructor_ref);
        let initial_supply = aptos_framework::fungible_asset::mint(&mint_ref, GUI_INITIAL_SUPPLY);
        aptos_framework::primary_fungible_store::deposit(admin_addr, initial_supply);

        // Initialize platform state
        move_to(admin, PlatformState {
            admin: admin_addr,
            tournament_counter: 0,
            tournaments: std::table::new(),
            gui_token_metadata,
            fee_collector: fee_collector_addr,
            fee_collector_cap,
        });

        // Initialize events
        move_to(admin, PlatformEvents {
            tournament_created_events: aptos_framework::account::new_event_handle<TournamentCreated>(admin),
            meme_submitted_events: aptos_framework::account::new_event_handle<MemeSubmitted>(admin),
            vote_cast_events: aptos_framework::account::new_event_handle<VoteCast>(admin),
            winner_announced_events: aptos_framework::account::new_event_handle<WinnerAnnounced>(admin),
        });
    }

    // Create a new tournament
    public entry fun create_tournament(
        creator: &signer,
        title: String,
        duration_hours: u64,
        voting_duration_hours: u64,
    ) acquires PlatformState, PlatformEvents {
        let creator_addr = signer::address_of(creator);
        let platform_state = borrow_global_mut<PlatformState>(@gui_arena);
        
        let tournament_id = platform_state.tournament_counter + 1;
        platform_state.tournament_counter = tournament_id;
        
        let current_time = timestamp::now_seconds();
        let end_time = current_time + (duration_hours * 3600);
        let voting_end_time = end_time + (voting_duration_hours * 3600);
        
        let tournament = Tournament {
            id: tournament_id,
            title,
            creator: creator_addr,
            start_time: current_time,
            end_time,
            voting_end_time,
            state: TOURNAMENT_ACTIVE,
            submissions: std::table::new(),
            participant_addresses: vector::empty(),
            winner: std::option::none(),
            total_prize_pool: 0,
        };
        
        std::table::add(&mut platform_state.tournaments, tournament_id, tournament);
        
        let platform_events = borrow_global_mut<PlatformEvents>(@gui_arena);
        aptos_framework::event::emit_event(&mut platform_events.tournament_created_events, TournamentCreated {
            tournament_id,
            title,
            creator: creator_addr,
        });
    }

    // Submit a meme to tournament
    public entry fun submit_meme(
        user: &signer,
        tournament_id: u64,
        title: String,
        ipfs_hash: String,
    ) acquires PlatformState, PlatformEvents {
        let user_addr = signer::address_of(user);
        let platform_state = borrow_global_mut<PlatformState>(@gui_arena);
        
        assert!(std::table::contains(&platform_state.tournaments, tournament_id), error::not_found(E_TOURNAMENT_NOT_FOUND));
        let tournament = std::table::borrow_mut(&mut platform_state.tournaments, tournament_id);
        assert!(tournament.state == TOURNAMENT_ACTIVE, error::invalid_state(E_VOTING_ENDED));
        assert!(!std::table::contains(&tournament.submissions, user_addr), error::already_exists(E_ALREADY_SUBMITTED));
        
        // Check GUI balance and stake
        let gui_balance = aptos_framework::primary_fungible_store::balance(user_addr, platform_state.gui_token_metadata);
        assert!(gui_balance >= GUI_SUBMISSION_STAKE, error::invalid_argument(E_INSUFFICIENT_GUI_TOKENS));
        
        // Transfer stake to platform
        let stake_fa = aptos_framework::primary_fungible_store::withdraw(user, platform_state.gui_token_metadata, GUI_SUBMISSION_STAKE);
        aptos_framework::primary_fungible_store::deposit(platform_state.fee_collector, stake_fa);
        tournament.total_prize_pool = tournament.total_prize_pool + GUI_SUBMISSION_STAKE;
        
        // Create submission
        let submission = Submission {
            creator: user_addr,
            title,
            ipfs_hash,
            votes: 0,
            gui_earned: 0,
        };
        
        std::table::add(&mut tournament.submissions, user_addr, submission);
        vector::push_back(&mut tournament.participant_addresses, user_addr);
        
        let platform_events = borrow_global_mut<PlatformEvents>(@gui_arena);
        aptos_framework::event::emit_event(&mut platform_events.meme_submitted_events, MemeSubmitted {
            tournament_id,
            creator: user_addr,
            title,
            ipfs_hash,
        });
    }

    // Vote for a meme using GUI tokens
    public entry fun vote_for_meme(
        voter: &signer,
        tournament_id: u64,
        submission_creator: address,
    ) acquires PlatformState, PlatformEvents {
        let voter_addr = signer::address_of(voter);
        let platform_state = borrow_global_mut<PlatformState>(@gui_arena);
        
        assert!(std::table::contains(&platform_state.tournaments, tournament_id), error::not_found(E_TOURNAMENT_NOT_FOUND));
        let tournament = std::table::borrow_mut(&mut platform_state.tournaments, tournament_id);
        assert!(tournament.state == TOURNAMENT_VOTING, error::invalid_state(E_VOTING_ENDED));
        assert!(voter_addr != submission_creator, error::invalid_argument(E_CANNOT_VOTE_OWN_SUBMISSION));
        assert!(std::table::contains(&tournament.submissions, submission_creator), error::not_found(E_TOURNAMENT_NOT_FOUND));
        
        // Check GUI balance
        let gui_balance = aptos_framework::primary_fungible_store::balance(voter_addr, platform_state.gui_token_metadata);
        assert!(gui_balance >= GUI_VOTING_COST, error::invalid_argument(E_INSUFFICIENT_GUI_TOKENS));
        
        // Transfer GUI for voting
        let vote_fa = aptos_framework::primary_fungible_store::withdraw(voter, platform_state.gui_token_metadata, GUI_VOTING_COST);
        
        // 70% to prize pool, 30% to submission creator
        let creator_reward = (GUI_VOTING_COST * 30) / 100;
        let prize_pool_amount = GUI_VOTING_COST - creator_reward;
        
        let creator_fa = aptos_framework::fungible_asset::extract(&mut vote_fa, creator_reward);
        aptos_framework::primary_fungible_store::deposit(submission_creator, creator_fa);
        aptos_framework::primary_fungible_store::deposit(platform_state.fee_collector, vote_fa);
        
        tournament.total_prize_pool = tournament.total_prize_pool + prize_pool_amount;
        
        // Update submission
        let submission = std::table::borrow_mut(&mut tournament.submissions, submission_creator);
        submission.votes = submission.votes + 1;
        submission.gui_earned = submission.gui_earned + creator_reward;
        
        let platform_events = borrow_global_mut<PlatformEvents>(@gui_arena);
        aptos_framework::event::emit_event(&mut platform_events.vote_cast_events, VoteCast {
            tournament_id,
            voter: voter_addr,
            submission_creator,
            gui_spent: GUI_VOTING_COST,
        });
    }

    // End tournament and announce winner
    public entry fun end_tournament(
        admin: &signer,
        tournament_id: u64,
    ) acquires PlatformState, PlatformEvents {
        let admin_addr = signer::address_of(admin);
        let platform_state = borrow_global_mut<PlatformState>(@gui_arena);
        assert!(platform_state.admin == admin_addr, error::permission_denied(E_NOT_ADMIN));
        assert!(std::table::contains(&platform_state.tournaments, tournament_id), error::not_found(E_TOURNAMENT_NOT_FOUND));
        
        let tournament = std::table::borrow_mut(&mut platform_state.tournaments, tournament_id);
        assert!(tournament.state == TOURNAMENT_VOTING, error::invalid_state(E_VOTING_ENDED));
        
        // Find winner (most votes)
        let winner_addr = std::option::none<address>();
        let max_votes = 0;
        
        let participants_len = vector::length(&tournament.participant_addresses);
        let i = 0;
        while (i < participants_len) {
            let participant = *vector::borrow(&tournament.participant_addresses, i);
            let submission = std::table::borrow(&tournament.submissions, participant);
            if (submission.votes > max_votes) {
                max_votes = submission.votes;
                winner_addr = std::option::some(participant);
            };
            i = i + 1;
        };
        
        tournament.state = TOURNAMENT_ENDED;
        tournament.winner = winner_addr;
        
        // Distribute prize to winner
        if (std::option::is_some(&winner_addr)) {
            let winner = std::option::extract(&mut winner_addr);
            let prize_amount = tournament.total_prize_pool + GUI_WINNER_REWARD;
            
            // Mint additional GUI reward for winner
            let constructor_ref = aptos_framework::object::create_named_object(admin, b"GUI_TOKEN");
            let mint_ref = aptos_framework::fungible_asset::generate_mint_ref(&constructor_ref);
            let winner_reward = aptos_framework::fungible_asset::mint(&mint_ref, prize_amount);
            aptos_framework::primary_fungible_store::deposit(winner, winner_reward);
            
            let platform_events = borrow_global_mut<PlatformEvents>(@gui_arena);
            aptos_framework::event::emit_event(&mut platform_events.winner_announced_events, WinnerAnnounced {
                tournament_id,
                winner,
                gui_prize: prize_amount,
            });
        };
    }

    // Update tournament state (admin function)
    public entry fun update_tournament_state(
        admin: &signer,
        tournament_id: u64,
        new_state: u8,
    ) acquires PlatformState {
        let admin_addr = signer::address_of(admin);
        let platform_state = borrow_global_mut<PlatformState>(@gui_arena);
        assert!(platform_state.admin == admin_addr, error::permission_denied(E_NOT_ADMIN));
        assert!(std::table::contains(&platform_state.tournaments, tournament_id), error::not_found(E_TOURNAMENT_NOT_FOUND));
        
        let tournament = std::table::borrow_mut(&mut platform_state.tournaments, tournament_id);
        tournament.state = new_state;
    }

    // View functions
    #[view]
    public fun get_tournament_info(tournament_id: u64): (String, address, u64, u64, u64, u8, u64) acquires PlatformState {
        let platform_state = borrow_global<PlatformState>(@gui_arena);
        assert!(std::table::contains(&platform_state.tournaments, tournament_id), error::not_found(E_TOURNAMENT_NOT_FOUND));
        
        let tournament = std::table::borrow(&platform_state.tournaments, tournament_id);
        (
            tournament.title,
            tournament.creator,
            tournament.start_time,
            tournament.end_time,
            tournament.voting_end_time,
            tournament.state,
            tournament.total_prize_pool
        )
    }

    #[view]
    public fun get_submission_info(tournament_id: u64, creator: address): (String, String, u64, u64) acquires PlatformState {
        let platform_state = borrow_global<PlatformState>(@gui_arena);
        assert!(std::table::contains(&platform_state.tournaments, tournament_id), error::not_found(E_TOURNAMENT_NOT_FOUND));
        
        let tournament = std::table::borrow(&platform_state.tournaments, tournament_id);
        assert!(std::table::contains(&tournament.submissions, creator), error::not_found(E_TOURNAMENT_NOT_FOUND));
        
        let submission = std::table::borrow(&tournament.submissions, creator);
        (submission.title, submission.ipfs_hash, submission.votes, submission.gui_earned)
    }

    #[view]
    public fun get_gui_token_metadata(): address acquires PlatformState {
        let platform_state = borrow_global<PlatformState>(@gui_arena);
        aptos_framework::object::object_address(&platform_state.gui_token_metadata)
    }

    #[view]
    public fun get_gui_balance(user: address): u64 acquires PlatformState {
        let platform_state = borrow_global<PlatformState>(@gui_arena);
        aptos_framework::primary_fungible_store::balance(user, platform_state.gui_token_metadata)
    }

    #[view]
    public fun get_tournament_participants(tournament_id: u64): vector<address> acquires PlatformState {
        let platform_state = borrow_global<PlatformState>(@gui_arena);
        assert!(std::table::contains(&platform_state.tournaments, tournament_id), error::not_found(E_TOURNAMENT_NOT_FOUND));
        
        let tournament = std::table::borrow(&platform_state.tournaments, tournament_id);
        tournament.participant_addresses
    }

    #[view]
    public fun get_platform_stats(): (u64, address) acquires PlatformState {
        let platform_state = borrow_global<PlatformState>(@gui_arena);
        (platform_state.tournament_counter, platform_state.admin)
    }

    // Admin function to distribute GUI tokens
    public entry fun distribute_gui_tokens(
        admin: &signer,
        recipient: address,
        amount: u64,
    ) acquires PlatformState {
        let admin_addr = signer::address_of(admin);
        let platform_state = borrow_global<PlatformState>(@gui_arena);
        assert!(platform_state.admin == admin_addr, error::permission_denied(E_NOT_ADMIN));
        
        // Transfer from admin to recipient
        let gui_fa = aptos_framework::primary_fungible_store::withdraw(admin, platform_state.gui_token_metadata, amount);
        aptos_framework::primary_fungible_store::deposit(recipient, gui_fa);
    }

    // Test function
    #[test_only]
    public fun init_for_test(admin: &signer) {
        init_module(admin);
    }
}