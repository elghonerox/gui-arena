/// GUI Arena - Decentralized Meme Battle Platform
/// A comprehensive smart contract for tournament-based meme competitions with quadratic voting,
/// NFT rewards, creator profiles, staking mechanisms, and anti-manipulation security features.
module gui_arena::gui_arena {
    use std::string;
    use std::string::{Self, String, utf8};
    use std::vector::{Self, vector};
    use std::option::{Self, Option};
    use std::option;
    use std::signer;
    use std::error;
    use std::table::{Self, Table};
    use aptos_framework::coin;
    use aptos_framework::timestamp;
    use aptos_framework::account::{Self, SignerCapability};
    use aptos_framework::event::{Self, EventHandle};
    use aptos_framework::object::{Self, Object};
    use aptos_framework::aptos_coin::AptosCoin as GUIToken;
    use aptos_framework::resource_account;
    use aptos_token_objects::collection;
    use aptos_token_objects::token;

    // Error codes
    const E_NOT_ADMIN: u64 = 1;
    const E_TOURNAMENT_NOT_FOUND: u64 = 2;
    const E_INVALID_TOURNAMENT_STATE: u64 = 3;
    const E_INSUFFICIENT_STAKE: u64 = 4;
    const E_ALREADY_SUBMITTED: u64 = 5;
    const E_TOURNAMENT_FULL: u64 = 6;
    const E_VOTING_ENDED: u64 = 7;
    const E_CANNOT_VOTE_OWN_SUBMISSION: u64 = 8;
    const E_INSUFFICIENT_ENTRY_FEE: u64 = 9;
    const E_VOTING_COOLDOWN: u64 = 10;
    const E_INVALID_TIER: u64 = 11;
    const E_MANIPULATION_DETECTED: u64 = 12;
    const E_INVALID_STAKE_DURATION: u64 = 13;
    const E_STAKE_NOT_FOUND: u64 = 14;
    const E_SUBMISSION_NOT_FOUND: u64 = 15;
    const E_STAKE_LOCKED: u64 = 16;

    // Constants
    const COLLECTION_NAME: vector<u8> = b"GUI Arena Winners";
    const COLLECTION_DESCRIPTION: vector<u8> = b"NFTs for GUI Arena tournament winners";
    const VOTING_COOLDOWN_SECONDS: u64 = 300;
    const MANIPULATION_VOTE_THRESHOLD: u64 = 10;
    const TIER_1_MIN_STAKE: u64 = 100;
    const TIER_2_MIN_STAKE: u64 = 500;
    const TIER_3_MIN_STAKE: u64 = 1000;
    const STAKE_DURATION_1_MONTH: u64 = 2592000;
    const STAKE_DURATION_3_MONTHS: u64 = 7776000;
    const STAKE_DURATION_1_YEAR: u64 = 31536000;
    const STAKE_BONUS_1_MONTH: u64 = 10;
    const STAKE_BONUS_3_MONTHS: u64 = 25;
    const STAKE_BONUS_1_YEAR: u64 = 50;

    // Tournament states
    const TOURNAMENT_UPCOMING: u8 = 0;
    const TOURNAMENT_ACTIVE: u8 = 1;
    const TOURNAMENT_VOTING: u8 = 2;
    const TOURNAMENT_ENDED: u8 = 3;

    // Struct definitions
    struct Tournament has store {
        id: u64,
        title: String,
        description: String,
        creator: address,
        entry_fee: u64,
        start_time: u64,
        end_time: u64,
        voting_end_time: u64,
        max_participants: u64,
        theme: String,
        tier: u8,
        state: u8,
        total_prize_pool: u64,
        participants: vector<address>,
        submissions: Table<address, Submission>,
        votes: Table<address, Table<address, Vote>>,
        winner_addresses: vector<address>,
    }

    struct Submission has store {
        creator: address,
        title: String,
        description: String,
        ipfs_hash: String,
        timestamp: u64,
        total_votes: u64,
        quadratic_score: u64,
    }

    struct Vote has store, drop {
        voter: address,
        submission_creator: address,
        weight: u64,
        timestamp: u64,
    }

    struct CreatorProfile has store {
        address: address,
        total_submissions: u64,
        total_wins: u64,
        total_earnings: u64,
        reputation_score: u64,
        join_date: u64,
        last_vote_time: u64,
        vote_count_last_minute: u64,
        last_minute_start: u64,
    }

    struct Stake has store, drop {
        amount: u64,
        duration: u64,
        start_time: u64,
        bonus_rate: u64,
        is_active: bool,
    }

    struct PlatformState has key {
        admin: address,
        fee_collector: address,
        tournament_counter: u64,
        tournaments: Table<u64, Tournament>,
        creator_profiles: Table<address, CreatorProfile>,
        stakes: Table<address, Stake>,
        nft_collection: Option<Object<collection::Collection>>,
        total_staked: u64,
        platform_fee_rate: u64,
        // Resource account for NFT minting and prize distribution
        resource_signer_cap: Option<SignerCapability>, // Add this to store the capability
    }

    // Event structs
    struct TournamentCreated has drop, store {
        tournament_id: u64,
        title: String,
        creator: address,
        entry_fee: u64,
        tier: u8,
        start_time: u64,
        end_time: u64,
    }

    struct TournamentStarted has drop, store {
        tournament_id: u64,
        title: String,
    }

    struct TournamentEnded has drop, store {
        tournament_id: u64,
        title: String,
        winners: vector<address>,
        total_prize_pool: u64,
    }

    struct MemeSubmitted has drop, store {
        tournament_id: u64,
        creator: address,
        title: String,
        ipfs_hash: String,
        timestamp: u64,
    }

    struct VoteCast has drop, store {
        tournament_id: u64,
        voter: address,
        submission_creator: address,
        weight: u64,
        timestamp: u64,
    }

    struct WinnerAnnounced has drop, store {
        tournament_id: u64,
        winner: address,
        rank: u64,
        prize_amount: u64,
    }

    struct PrizeDistributed has drop, store {
        tournament_id: u64,
        recipient: address,
        amount: u64,
    }

    struct NFTMinted has drop, store {
        tournament_id: u64,
        recipient: address,
        token_address: address,
        rank: u64,
    }

    struct TokensStaked has drop, store {
        staker: address,
        amount: u64,
        duration: u64,
        bonus_rate: u64,
        timestamp: u64,
    }

    struct TokensWithdrawn has drop, store {
        staker: address,
        amount: u64,
        reward: u64,
        timestamp: u64,
    }

    struct ManipulationDetected has drop, store {
        user: address,
        tournament_id: u64,
        violation_type: String,
        timestamp: u64,
    }

    struct PlatformEvents has key {
        tournament_created_events: EventHandle<TournamentCreated>,
        tournament_started_events: EventHandle<TournamentStarted>,
        tournament_ended_events: EventHandle<TournamentEnded>,
        meme_submitted_events: EventHandle<MemeSubmitted>,
        vote_cast_events: EventHandle<VoteCast>,
        winner_announced_events: EventHandle<WinnerAnnounced>,
        prize_distributed_events: EventHandle<PrizeDistributed>,
        nft_minted_events: EventHandle<NFTMinted>,
        tokens_staked_events: EventHandle<TokensStaked>,
        tokens_withdrawn_events: EventHandle<TokensWithdrawn>,
        manipulation_detected_events: EventHandle<ManipulationDetected>,
    }

    // Helper functions
    fun get_tournament_state(tournament: &Tournament): u8 {
        let now = timestamp::now_seconds();
        if (now < tournament.start_time) {
            TOURNAMENT_UPCOMING
        } else if (now < tournament.end_time) {
            TOURNAMENT_ACTIVE
        } else if (now < tournament.voting_end_time) {
            TOURNAMENT_VOTING
        } else {
            TOURNAMENT_ENDED
        }
    }

    fun get_min_stake_for_tier(tier: u8): u64 {
        if (tier == 1) {
            TIER_1_MIN_STAKE
        } else if (tier == 2) {
            TIER_2_MIN_STAKE
        } else if (tier == 3) {
            TIER_3_MIN_STAKE
        } else {
            0
        }
    }

    fun calculate_quadratic_voting_power(stake_amount: u64, reputation: u64): u64 {
        let base_power = stake_amount / 100;
        let reputation_bonus = reputation / 10;
        let total_power = base_power + reputation_bonus;
        // Quadratic formula: sqrt(total_power) * 10 for better precision
        let sqrt_power = sqrt_u64(total_power);
        sqrt_power * 10
    }

    fun sqrt_u64(x: u64): u64 {
        if (x == 0) return 0;
            let z = (x + 1) / 2;
            let y = x;
            let (mut_z, mut_y) = sqrt_loop(x, z, y);
            mut_y
        }
    
        fun sqrt_loop(x: u64, mut_z: u64, mut_y: u64): (u64, u64) {
            while (mut_z < mut_y) {
                mut_y = mut_z;
                mut_z = (x / mut_z + mut_z) / 2;
            };
            (mut_z, mut_y)
    }

    fun get_stake_bonus_rate(duration: u64): u64 {
        if (duration == STAKE_DURATION_1_MONTH) {
            STAKE_BONUS_1_MONTH
        } else if (duration == STAKE_DURATION_3_MONTHS) {
            STAKE_BONUS_3_MONTHS
        } else if (duration == STAKE_DURATION_1_YEAR) {
            STAKE_BONUS_1_YEAR
        } else {
            0
        }
    }

    fun check_manipulation(profile: &mut CreatorProfile): bool {
        let now = timestamp::now_seconds();
        
        // Reset counter if a new minute has started
        if (now >= profile.last_minute_start + 60) {
            profile.vote_count_last_minute = 0;
            profile.last_minute_start = now;
        };
        
        // Check if user has exceeded vote threshold
        if (profile.vote_count_last_minute >= MANIPULATION_VOTE_THRESHOLD) {
            true
        } else {
            false
        }
    }

    /// Collects participants who have submissions and their scores into winners and scores vectors.
/// Collects winners and their scores from participants who have submissions
fun collect_winners_and_scores(
    participants: &vector<address>,
    submissions: &table::Table<address, Submission>,
    winners: &mut vector<address>,
    scores: &mut vector<u64>
) {
    let len = vector::length(participants);
    let i = 0;
    while (i < len) {
        let participant = *vector::borrow(participants, i);
        if (table::contains(submissions, participant)) {
            let submission = table::borrow(submissions, participant);
            vector::push_back(winners, participant);
            vector::push_back(scores, submission.quadratic_score);
        };
        i = i + 1;
    };
}

/// Sorts winners and scores vectors in descending order of scores using bubble sort.
fun sort_winners_by_score(
    winners: &mut vector<address>,
    scores: &mut vector<u64>
) {
    let len = vector::length(winners);
    let i = 0;
    while (i < len) {
        let j = 0;
        while (j < len - i - 1) {
            let score1 = *vector::borrow(scores, j);
            let score2 = *vector::borrow(scores, j + 1);
            if (score1 < score2) {
                // Swap scores
                let temp_score = *vector::borrow(scores, j);
                *vector::borrow_mut(scores, j) = *vector::borrow(scores, j + 1);
                *vector::borrow_mut(scores, j + 1) = temp_score;

                // Swap winners
                let temp_winner = *vector::borrow(winners, j);
                *vector::borrow_mut(winners, j) = *vector::borrow(winners, j + 1);
                *vector::borrow_mut(winners, j + 1) = temp_winner;
            };
            j = j + 1;
        };
        i = i + 1;
    };
}

/// Example function to demonstrate usage
fun get_sorted_winners_and_scores(
    participants: &vector<address>,
    submissions: &table::Table<address, Submission>
): (vector<address>, vector<u64>) {
    let winners = vector::empty<address>();
    let scores = vector::empty<u64>();

    collect_winners_and_scores(participants, submissions, &mut winners, &mut scores);
    sort_winners_by_score(&mut winners, &mut scores);

    (winners, scores)
}
// Convert number to string helper
fun u64_to_string(value: u64): String {
    if (value == 0) {
        return string::utf8(b"0")
    };
    
    let digits = vector::empty<u8>();
    let temp = value;
    
    while (temp > 0) {
        let digit = ((temp % 10) as u8) + 48; // Convert to ASCII
        vector::push_back(&mut digits, digit);
        temp = temp / 10;
    };
    
    vector::reverse(&mut digits);
    string::utf8(digits)
}
    // Initialize platform
    public entry fun initialize(admin: &signer, fee_collector: address) {
        let admin_addr = signer::address_of(admin);
        
        // Register for coin if not already registered
        if (!coin::is_account_registered<GUIToken>(admin_addr)) {
            coin::register<GUIToken>(admin);
        };
        
        // Create resource account and store its signer capability
        let (resource_signer, signer_cap) = resource_account::create_resource_account(admin, b"gui_arena_resource");
        
        // Register resource account for coin if not already registered
        if (!coin::is_account_registered<GUIToken>(signer::address_of(&resource_signer))) {
            coin::register<GUIToken>(&resource_signer);
        };

        let platform_state = PlatformState {
            admin: admin_addr,
            fee_collector,
            tournament_counter: 0,
            tournaments: table::new(),
            creator_profiles: table::new(),
            stakes: table::new(),
            nft_collection: option::none(),
            total_staked: 0,
            platform_fee_rate: 500, // 5%
            resource_signer_cap: option::some(signer_cap), // Store the capability
        };
        
        let platform_events = PlatformEvents {
            tournament_created_events: account::new_event_handle<TournamentCreated>(admin),
            tournament_started_events: account::new_event_handle<TournamentStarted>(admin),
            tournament_ended_events: account::new_event_handle<TournamentEnded>(admin),
            meme_submitted_events: account::new_event_handle<MemeSubmitted>(admin),
            vote_cast_events: account::new_event_handle<VoteCast>(admin),
            winner_announced_events: account::new_event_handle<WinnerAnnounced>(admin),
            prize_distributed_events: account::new_event_handle<PrizeDistributed>(admin),
            nft_minted_events: account::new_event_handle<NFTMinted>(admin),
            tokens_staked_events: account::new_event_handle<TokensStaked>(admin),
            tokens_withdrawn_events: account::new_event_handle<TokensWithdrawn>(admin),
            manipulation_detected_events: account::new_event_handle<ManipulationDetected>(admin),
        };
        
        move_to(admin, platform_state);
        move_to(admin, platform_events);
        // Deposit the resource account signer capability into the module's account
        resource_account::move_to(&resource_signer, signer_cap); 
    }

    // Create NFT collection
    public entry fun create_nft_collection(admin: &signer) acquires PlatformState {
        let admin_addr = signer::address_of(admin);
        let platform_state = borrow_global_mut<PlatformState>(@gui_arena);
        assert!(platform_state.admin == admin_addr, error::permission_denied(E_NOT_ADMIN));
        assert!(option::is_none(&platform_state.nft_collection), error::already_exists(0)); // Prevent re-creation
        
        let collection_constructor_ref = collection::create_unlimited_collection(
            admin,
            string::utf8(COLLECTION_DESCRIPTION),
            string::utf8(COLLECTION_NAME),
            option::none(),
            string::utf8(b"https://guiarena.com/collection")
        );
        
        let collection_object = object::object_from_constructor_ref<collection::Collection>(&collection_constructor_ref);
        platform_state.nft_collection = option::some(collection_object);
    }

    // Create tournament
    public entry fun create_tournament(
        creator: &signer,
        title: String,
        description: String,
        entry_fee: u64,
        start_time: u64,
        end_time: u64,
        voting_end_time: u64,
        max_participants: u64,
        theme: String,
        tier: u8
    ) acquires PlatformState, PlatformEvents {
        let creator_addr = signer::address_of(creator);
        let platform_state = borrow_global_mut<PlatformState>(@gui_arena);
        let platform_events = borrow_global_mut<PlatformEvents>(@gui_arena);
        
        assert!(tier >= 1 && tier <= 3, error::invalid_argument(E_INVALID_TIER));
        assert!(start_time > timestamp::now_seconds(), error::invalid_argument(E_INVALID_TOURNAMENT_STATE));
        assert!(end_time > start_time, error::invalid_argument(E_INVALID_TOURNAMENT_STATE));
        assert!(voting_end_time > end_time, error::invalid_argument(E_INVALID_TOURNAMENT_STATE));
        
        // Check if creator has required stake for tier
        let min_stake = get_min_stake_for_tier(tier);
        if (table::contains(&platform_state.stakes, creator_addr)) {
            let stake = table::borrow(&platform_state.stakes, creator_addr);
            assert!(stake.amount >= min_stake && stake.is_active, error::invalid_argument(E_INSUFFICIENT_STAKE));
        } else {
            assert!(min_stake == 0, error::invalid_argument(E_INSUFFICIENT_STAKE));
        };
        
        // Create creator profile if doesn't exist
        if (!table::contains(&platform_state.creator_profiles, creator_addr)) {
            let profile = CreatorProfile {
                address: creator_addr,
                total_submissions: 0,
                total_wins: 0,
                total_earnings: 0,
                reputation_score: 100,
                join_date: timestamp::now_seconds(),
                last_vote_time: 0,
                vote_count_last_minute: 0,
                last_minute_start: 0,
            };
            table::add(&mut platform_state.creator_profiles, creator_addr, profile);
        };
        
        platform_state.tournament_counter = platform_state.tournament_counter + 1;
        let tournament_id = platform_state.tournament_counter;
        
        let tournament = Tournament {
            id: tournament_id,
            title,
            description,
            creator: creator_addr,
            entry_fee,
            start_time,
            end_time,
            voting_end_time,
            max_participants,
            theme,
            tier,
            state: TOURNAMENT_UPCOMING,
            total_prize_pool: 0,
            participants: vector::empty(),
            submissions: table::new(),
            votes: table::new(),
            winner_addresses: vector::empty(),
        };
        
        table::add(&mut platform_state.tournaments, tournament_id, tournament);
        
        // Emit event
        event::emit_event(&mut platform_events.tournament_created_events, TournamentCreated {
            tournament_id,
            title,
            creator: creator_addr,
            entry_fee,
            tier,
            start_time,
            end_time,
        });
    }

    // Submit meme
    public entry fun submit_meme(
        creator: &signer,
        tournament_id: u64,
        title: String,
        description: String,
        ipfs_hash: String
    ) acquires PlatformState, PlatformEvents {
        let creator_addr = signer::address_of(creator);
        let platform_state = borrow_global_mut<PlatformState>(@gui_arena);
        let platform_events = borrow_global_mut<PlatformEvents>(@gui_arena);
        
        assert!(table::contains(&platform_state.tournaments, tournament_id), error::not_found(E_TOURNAMENT_NOT_FOUND));
        let tournament = table::borrow_mut(&mut platform_state.tournaments, tournament_id);
        
        let current_state = get_tournament_state(tournament);
        assert!(current_state == TOURNAMENT_ACTIVE, error::invalid_state(E_INVALID_TOURNAMENT_STATE));
        
        assert!(!table::contains(&tournament.submissions, creator_addr), error::already_exists(E_ALREADY_SUBMITTED));
        assert!(vector::length(&tournament.participants) < tournament.max_participants, error::resource_exhausted(E_TOURNAMENT_FULL));
        
        // Check entry fee
        if (tournament.entry_fee > 0) {
            assert!(coin::balance<GUIToken>(creator_addr) >= tournament.entry_fee, error::invalid_argument(E_INSUFFICIENT_ENTRY_FEE));
            // Corrected transfer function
            coin::transfer<GUIToken>(creator, platform_state.fee_collector, tournament.entry_fee);
            tournament.total_prize_pool = tournament.total_prize_pool + tournament.entry_fee;
        };
        
        // Add participant
        vector::push_back(&mut tournament.participants, creator_addr);
        
        // Create submission
        let submission = Submission {
            creator: creator_addr,
            title,
            description,
            ipfs_hash,
            timestamp: timestamp::now_seconds(),
            total_votes: 0,
            quadratic_score: 0,
        };
        
        table::add(&mut tournament.submissions, creator_addr, submission);
        table::add(&mut tournament.votes, creator_addr, table::new());
        
        // Update creator profile
        if (!table::contains(&platform_state.creator_profiles, creator_addr)) {
             let profile = CreatorProfile {
                address: creator_addr,
                total_submissions: 0,
                total_wins: 0,
                total_earnings: 0,
                reputation_score: 100,
                join_date: timestamp::now_seconds(),
                last_vote_time: 0,
                vote_count_last_minute: 0,
                last_minute_start: 0,
            };
            table::add(&mut platform_state.creator_profiles, creator_addr, profile);
        };
        let profile = table::borrow_mut(&mut platform_state.creator_profiles, creator_addr);
        profile.total_submissions = profile.total_submissions + 1;
        
        // Emit event
        event::emit_event(&mut platform_events.meme_submitted_events, MemeSubmitted {
            tournament_id,
            creator: creator_addr,
            title,
            ipfs_hash,
            timestamp: timestamp::now_seconds(),
        });
    }

    // Cast vote
    public entry fun cast_vote(
        voter: &signer,
        tournament_id: u64,
        submission_creator: address,
        weight: u64
    ) acquires PlatformState, PlatformEvents {
        let voter_addr = signer::address_of(voter);
        let platform_state = borrow_global_mut<PlatformState>(@gui_arena);
        let platform_events = borrow_global_mut<PlatformEvents>(@gui_arena);
        
        assert!(table::contains(&platform_state.tournaments, tournament_id), error::not_found(E_TOURNAMENT_NOT_FOUND));
        let tournament = table::borrow_mut(&mut platform_state.tournaments, tournament_id);
        
        let current_state = get_tournament_state(tournament);
        assert!(current_state == TOURNAMENT_VOTING, error::invalid_state(E_VOTING_ENDED));
        
        assert!(voter_addr != submission_creator, error::invalid_argument(E_CANNOT_VOTE_OWN_SUBMISSION));
        assert!(table::contains(&tournament.submissions, submission_creator), error::not_found(E_SUBMISSION_NOT_FOUND));
        
        // Check voting cooldown and manipulation
        if (table::contains(&platform_state.creator_profiles, voter_addr)) {
            let profile = table::borrow_mut(&mut platform_state.creator_profiles, voter_addr);
            let now = timestamp::now_seconds();
            
            assert!(now >= profile.last_vote_time + VOTING_COOLDOWN_SECONDS, error::invalid_state(E_VOTING_COOLDOWN));
            
            // Update vote count for manipulation detection
            profile.vote_count_last_minute = profile.vote_count_last_minute + 1;
            profile.last_vote_time = now;
            
            assert!(!check_manipulation(profile), error::invalid_state(E_MANIPULATION_DETECTED));
        } else {
            // Create profile for new voter
            let profile = CreatorProfile {
                address: voter_addr,
                total_submissions: 0,
                total_wins: 0,
                total_earnings: 0,
                reputation_score: 100,
                join_date: timestamp::now_seconds(),
                last_vote_time: timestamp::now_seconds(),
                vote_count_last_minute: 1,
                last_minute_start: timestamp::now_seconds(),
            };
            table::add(&mut platform_state.creator_profiles, voter_addr, profile);
        };
        
        // Calculate voting power
        let voting_power = if (table::contains(&platform_state.stakes, voter_addr)) {
            let stake = table::borrow(&platform_state.stakes, voter_addr);
            let reputation = if (table::contains(&platform_state.creator_profiles, voter_addr)) {
                table::borrow(&platform_state.creator_profiles, voter_addr).reputation_score
            } else { 100 };
            calculate_quadratic_voting_power(stake.amount, reputation)
        } else { 1 };
        
        let effective_weight = if (weight > voting_power) { voting_power } else { weight };
        
        // Record vote
        let vote = Vote {
            voter: voter_addr,
            submission_creator,
            weight: effective_weight,
            timestamp: timestamp::now_seconds(),
        };
        
        let votes_table_ref = table::borrow_mut(&mut tournament.votes, submission_creator);
        if (table::contains(votes_table_ref, voter_addr)) {
            *table::borrow_mut(votes_table_ref, voter_addr) = vote;
        } else {
            table::add(votes_table_ref, voter_addr, vote);
        };
        
        // Update submission score
        let submission = table::borrow_mut(&mut tournament.submissions, submission_creator);
        submission.total_votes = submission.total_votes + 1;
        submission.quadratic_score = submission.quadratic_score + effective_weight;
        
        // Emit event
        event::emit_event(&mut platform_events.vote_cast_events, VoteCast {
            tournament_id,
            voter: voter_addr,
            submission_creator,
            weight: effective_weight,
            timestamp: timestamp::now_seconds(),
        });
    }

    // Stake GUI tokens
    public entry fun stake_gui(
        user: &signer,
        amount: u64,
        duration: u64
    ) acquires PlatformState, PlatformEvents {
        let user_addr = signer::address_of(user);
        let platform_state = borrow_global_mut<PlatformState>(@gui_arena);
        let platform_events = borrow_global_mut<PlatformEvents>(@gui_arena);
        
        assert!(
            duration == STAKE_DURATION_1_MONTH || 
            duration == STAKE_DURATION_3_MONTHS || 
            duration == STAKE_DURATION_1_YEAR,
            error::invalid_argument(E_INVALID_STAKE_DURATION)
        );
        
        // Transfer tokens to platform's resource account
        let resource_signer_cap = option::borrow(&platform_state.resource_signer_cap);
        let resource_address = resource_account::address_of(resource_signer_cap);
        coin::transfer<GUIToken>(user, resource_address, amount);
        let resource_address = resource_account::get_account_address(&platform_state.resource_signer_cap);
        coin::transfer<GUIToken>(user, resource_address, amount);
        
        let bonus_rate = get_stake_bonus_rate(duration);
        let stake = Stake {
            amount,
            duration,
            start_time: timestamp::now_seconds(),
            bonus_rate,
            is_active: true,
        };
        
        if (table::contains(&platform_state.stakes, user_addr)) {
            *table::borrow_mut(&mut platform_state.stakes, user_addr) = stake;
        } else {
            table::add(&mut platform_state.stakes, user_addr, stake);
        };
        
        platform_state.total_staked = platform_state.total_staked + amount;
        
        // Emit event
        event::emit_event(&mut platform_events.tokens_staked_events, TokensStaked {
            staker: user_addr,
            amount,
            duration,
            bonus_rate,
            timestamp: timestamp::now_seconds(),
        });
    }

    // Withdraw stake
    public entry fun withdraw_stake(user: &signer) acquires PlatformState, PlatformEvents {
        let user_addr = signer::address_of(user);
        let platform_state = borrow_global_mut<PlatformState>(@gui_arena);
        let platform_events = borrow_global_mut<PlatformEvents>(@gui_arena);
        
        assert!(table::contains(&platform_state.stakes, user_addr), error::not_found(E_STAKE_NOT_FOUND));
        
        let stake = table::borrow_mut(&mut platform_state.stakes, user_addr);
        assert!(stake.is_active, error::invalid_state(E_STAKE_NOT_FOUND));
        
        let now = timestamp::now_seconds();
        assert!(now >= stake.start_time + stake.duration, error::invalid_state(E_STAKE_LOCKED));
        
        // Calculate reward
        // Transfer tokens back to user from resource account
        let resource_signer_cap = option::borrow_mut(&mut platform_state.resource_signer_cap);
        resource_account::acquire_signer(resource_signer_cap, |resource_signer| {
            coin::transfer<GUIToken>(&resource_signer, user_addr, total_withdrawal);
        });
        resource_account::acquire_signer(resource_signer_cap, |resource_signer| {
            coin::transfer<GUIToken>(&resource_signer, user_addr, total_withdrawal);
        });
        
        stake.is_active = false;
        platform_state.total_staked = platform_state.total_staked - stake.amount;
        
        // Emit event
        event::emit_event(&mut platform_events.tokens_withdrawn_events, TokensWithdrawn {
            staker: user_addr,
            amount: stake.amount,
            reward,
            timestamp: now,
        });
    }

    // Mint winner NFT
    public entry fun mint_winner_nft(
        admin: &signer,
        tournament_id: u64,
        winner: address,
        rank: u64
    ) acquires PlatformState, PlatformEvents {
        let admin_addr = signer::address_of(admin);
        let platform_state = borrow_global_mut<PlatformState>(@gui_arena); // Changed to mut to access resource_signer_cap
        let platform_events = borrow_global_mut<PlatformEvents>(@gui_arena);
        
        assert!(platform_state.admin == admin_addr, error::permission_denied(E_NOT_ADMIN));
        assert!(option::is_some(&platform_state.nft_collection), error::invalid_state(E_TOURNAMENT_NOT_FOUND)); // Placeholder error for now
        
        let tournament_title_str = u64_to_string(tournament_id);
        let rank_str = u64_to_string(rank);
        
        let token_name = string::utf8(b"GUI Arena Winner #");
        string::append(&mut token_name, tournament_title_str);
        string::append(&mut token_name, string::utf8(b" Rank "));
        string::append(&mut token_name, rank_str);
        
        let token_description = string::utf8(b"Winner NFT for GUI Arena Tournament #");
        string::append(&mut token_description, tournament_title_str);
        string::append(&mut token_description, string::utf8(b". Awarded to: "));
        string::append(&mut token_description, string::address_to_string(winner));
        
        let nft_collection_object = option::borrow(&platform_state.nft_collection);
        let collection_address = object::object_address(nft_collection_object);

        let resource_signer_cap = option::borrow(&platform_state.resource_signer_cap);

        resource_account::acquire_signer(resource_signer_cap, |resource_signer| {
            let token_object_constructor_ref = token::create_named_token(
                resource_signer, // Use the resource account signer
                collection::name(nft_collection_object), // Get collection name from object
                token_description,
                token_name,
                option::none(), // Royalties
                string::utf8(b"https://guiarena.com/nft_metadata/") // URI
            );
            
            token::mint_named_token_to(
                resource_signer, // Use the resource account signer
                object::from_constructor_ref<token::Token>(&token_object_constructor_ref), // Token object
                winner, // Recipient
            );

            let token_address = object::object_address(&object::from_constructor_ref<token::Token>(&token_object_constructor_ref));

            event::emit_event(&mut platform_events.nft_minted_events, NFTMinted {
                tournament_id,
                recipient: winner,
                token_address,
                rank,
            });
        });

        // Update creator profile for winner
        if (table::contains(&platform_state.creator_profiles, winner)) {
            let winner_profile = table::borrow_mut(&mut platform_state.creator_profiles, winner);
            winner_profile.total_wins = winner_profile.total_wins + 1;
            winner_profile.reputation_score = winner_profile.reputation_score + 50; // Award reputation for winning
        };
    }

    // End tournament
    public entry fun end_tournament(
        admin: &signer,
        tournament_id: u64
    ) acquires PlatformState, PlatformEvents {
        let admin_addr = signer::address_of(admin);
        let platform_state = borrow_global_mut<PlatformState>(@gui_arena);
        let platform_events = borrow_global_mut<PlatformEvents>(@gui_arena);
        
        assert!(platform_state.admin == admin_addr, error::permission_denied(E_NOT_ADMIN));
        assert!(table::contains(&platform_state.tournaments, tournament_id), error::not_found(E_TOURNAMENT_NOT_FOUND));
        
        let tournament = table::borrow_mut(&mut platform_state.tournaments, tournament_id);
        
        let current_state = get_tournament_state(tournament);
        assert!(current_state == TOURNAMENT_ENDED, error::invalid_state(E_INVALID_TOURNAMENT_STATE));
        assert!(tournament.state != TOURNAMENT_ENDED, error::invalid_state(E_INVALID_TOURNAMENT_STATE)); // Ensure it's not already ended
        
        // Calculate and sort winners
        let (winners, scores) = sort_winners(&tournament.participants, &tournament.submissions);
        tournament.winner_addresses = winners;
        tournament.state = TOURNAMENT_ENDED;

        let total_prize_pool = tournament.total_prize_pool;
        let num_winners = vector::length(&tournament.winner_addresses);
        let resource_signer_cap = option::borrow_mut(&mut platform_state.resource_signer_cap);

        // Distribute prizes and mint NFTs for top 3 (example)
        while (i < num_winners && i < 3) { // Distribute prizes to top 3
            let winner_addr = *vector::borrow(&tournament.winner_addresses, i);
            let winner_score = *vector::borrow(&scores, i);

            // Simple prize distribution: weighted by score, adjust as needed
            let prize_amount = (total_prize_pool * winner_score) / (tournament.total_prize_pool + 1); // Avoid division by zero

            if (prize_amount > 0) {
                resource_account::acquire_signer(resource_signer_cap, |resource_signer| {
                    coin::transfer<GUIToken>(&resource_signer, winner_addr, prize_amount);
                });
                distributed_prize = distributed_prize + prize_amount;

                event::emit_event(&mut platform_events.prize_distributed_events, PrizeDistributed {
                    tournament_id,
                    recipient: winner_addr,
                    amount: prize_amount,
                });

                // Update creator profile earnings
                if (table::contains(&platform_state.creator_profiles, winner_addr)) {
                    let winner_profile = table::borrow_mut(&mut platform_state.creator_profiles, winner_addr);
                    winner_profile.total_earnings = winner_profile.total_earnings + prize_amount;
                };
            };
    // Mint NFT for the winner
mint_winner_nft(admin, tournament_id, winner_addr, i + 1); // Pass admin signer for context

event::emit_event(&mut platform_events.winner_announced_events, WinnerAnnounced {
    tournament_id,
    winner: winner_addr,
    rank: i + 1,
    prize_amount,
});

i = i + 1;
// View functions

/// Returns tournament information by ID

/// Returns the stake details for a user
}

/// Returns submission info for a given tournament and creator

/// Returns list of winner addresses for a tournament

/// Returns platform-level statistics

/// Checks if user can participate in a given tier
}

/// Calculates voting power for a user
public fun get_voting_power(user: address): u64 acquires PlatformState {
    assert!(exists<PlatformState>(@gui_arena), error::not_found(0));
    let platform_state = borrow_global<PlatformState>(@gui_arena);

    let stake_amount = if (table::contains(&platform_state.stakes, user)) {
        table::borrow(&platform_state.stakes, user).amount
    } else {
        0
    };

    let reputation = if (table::contains(&platform_state.creator_profiles, user)) {
        table::borrow(&platform_state.creator_profiles, user).reputation_score
    } else {
        100
    };

    calculate_quadratic_voting_power(stake_amount, reputation)
}

// Admin functions

/// Admin: Updates platform fee rate
public entry fun update_platform_fee(admin: &signer, new_fee_rate: u64) acquires PlatformState {
    let admin_addr = signer::address_of(admin);
    let platform_state = borrow_global_mut<PlatformState>(@gui_arena);
    assert!(platform_state.admin == admin_addr, error::permission_denied(E_NOT_ADMIN));
    platform_state.platform_fee_rate = new_fee_rate;
}

/// Admin: Slashes user stake by amount and emits event
public entry fun slash_stake(admin: &signer, user: address, slash_amount: u64) acquires PlatformState, PlatformEvents {
    let admin_addr = signer::address_of(admin);
    let platform_state = borrow_global_mut<PlatformState>(@gui_arena);
    let platform_events = borrow_global_mut<PlatformEvents>(@gui_arena);

    assert!(platform_state.admin == admin_addr, error::permission_denied(E_NOT_ADMIN));
    assert!(table::contains(&platform_state.stakes, user), error::not_found(E_STAKE_NOT_FOUND));

    let stake = table::borrow_mut(&mut platform_state.stakes, user);
    assert!(stake.amount >= slash_amount, error::invalid_argument(E_INSUFFICIENT_STAKE));

    stake.amount = stake.amount - slash_amount;
    platform_state.total_staked = platform_state.total_staked - slash_amount;

    event::emit_event(&mut platform_events.manipulation_detected_events, ManipulationDetected {
        user,
        tournament_id: 0,
        violation_type: string::utf8(b"Stake Slashed by Admin"),
        timestamp: timestamp::now_seconds(),
    });
}

/// Admin: Pauses a tournament in emergencies
public entry fun emergency_pause_tournament(admin: &signer, tournament_id: u64) acquires PlatformState {
    let admin_addr = signer::address_of(admin);
    let platform_state = borrow_global_mut<PlatformState>(@gui_arena);
    assert!(platform_state.admin == admin_addr, error::permission_denied(E_NOT_ADMIN));
    assert!(table::contains(&platform_state.tournaments, tournament_id), error::not_found(E_TOURNAMENT_NOT_FOUND));

    let tournament = table::borrow_mut(&mut platform_state.tournaments, tournament_id);
    tournament.state = TOURNAMENT_ENDED;

    /// Returns tournament information by ID


    /// Returns a user's stake details
    public fun get_user_stake(user: address): (u64, u64, u64, u64, bool) acquires PlatformState {
        assert!(exists<PlatformState>(@gui_arena), error::not_found(0));
        let platform_state = borrow_global<PlatformState>(@gui_arena);
        let stake_info = table::borrow(&platform_state.stakes, user);
        (
            stake_info.amount,
            stake_info.start_time,
            stake_info.lock_duration,
            stake_info.reward,
            stake_info.claimed
        )
    }


    /// Returns submission information by tournament ID and creator address
    public fun get_submission_info(tournament_id: u64, creator: address): (String, String, String, u64, u64, u64) acquires PlatformState {
        assert!(exists<PlatformState>(@gui_arena), error::not_found(0));
        let platform_state = borrow_global<PlatformState>(@gui_arena);
        let submission_key = (tournament_id, creator);
        assert!(table::contains(&platform_state.submissions, submission_key), error::not_found(0));

        let submission = table::borrow(&platform_state.submissions, submission_key);
        (
            submission.image_url,
            submission.description,
            submission.external_url,
            submission.votes,
            submission.rank,
            submission.rewards
        )
    }


    /// Returns a vector of addresses representing the winners of a tournament
    public fun get_tournament_winners(tournament_id: u64): vector<address> acquires PlatformState {
        assert!(exists<PlatformState>(@gui_arena), error::not_found(0));
        let platform_state = borrow_global<PlatformState>(@gui_arena);
        assert!(table::contains(&platform_state.tournaments, tournament_id), error::not_found(E_TOURNAMENT_NOT_FOUND));
        let tournament = table::borrow(&platform_state.tournaments, tournament_id);
        tournament.winners
    }


    /// Returns global platform statistics
    public fun get_platform_stats(): (u64, u64, u64) acquires PlatformState {
        assert!(exists<PlatformState>(@gui_arena), error::not_found(0));
        let platform_state = borrow_global<PlatformState>(@gui_arena);
        (
            platform_state.total_tournaments,
            platform_state.total_votes,
            platform_state.total_earnings
        )
    }


    /// Checks whether a user can participate in a tournament of a given tier
    public fun can_user_participate(user: address, tier: u8): bool acquires PlatformState {
        assert!(exists<PlatformState>(@gui_arena), error::not_found(0));
        let platform_state = borrow_global<PlatformState>(@gui_arena);

        if (!table::contains(&platform_state.stakes, user)) {
            return false;
        };

        let stake_info = table::borrow(&platform_state.stakes, user);
        stake_info.tier >= tier
    }

}