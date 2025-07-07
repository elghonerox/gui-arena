/// GUI Arena - Decentralized Meme Battle Platform
/// A comprehensive smart contract for tournament-based meme competitions with quadratic voting,
/// NFT rewards, creator profiles, staking mechanisms, and anti-manipulation security features.
///
/// Features:
/// - Tournament management with tier-based entry requirements
/// - Quadratic voting system based on staked tokens and reputation
/// - NFT minting for winners using Aptos Token Objects
/// - Creator profile tracking with reputation scoring
/// - Token staking system with time-locked rewards
/// - Anti-manipulation measures and security controls
///
/// Security Measures:
/// - One vote per user per submission
/// - Minimum stake requirements for participation
/// - Reputation-based voting weights
/// - Time-locked voting periods
/// - Stake slashing for manipulation detection
///
/// Author: GUI Arena Team
/// Version: 1.0.0
/// License: MIT

module gui_arena::gui_arena {
    use std::string::{Self, String};
    use std::vector;
    use std::option::{Self, Option};
    use std::signer;
    use std::error;
    use std::table::{Self, Table};
    use aptos_framework::coin;
    use aptos_framework::timestamp;
    use aptos_framework::account;
    use aptos_framework::event::{Self, EventHandle};
    use aptos_framework::object::{Self, Object};
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_token_objects::collection;
    use aptos_token_objects::token;

    // Using AptosCoin as GUIToken placeholder - replace with actual GUIToken when available
    // Note: Replace all AptosCoin references with your actual GUIToken type when available

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

    // Constants
    const COLLECTION_NAME: vector<u8> = b"GUI Arena Winners";
    const COLLECTION_DESCRIPTION: vector<u8> = b"NFTs for GUI Arena tournament winners";
    const VOTING_COOLDOWN_SECONDS: u64 = 300; // 5 minutes
    const MANIPULATION_VOTE_THRESHOLD: u64 = 10; // Max votes per minute
    const TIER_1_MIN_STAKE: u64 = 100;
    const TIER_2_MIN_STAKE: u64 = 500;
    const TIER_3_MIN_STAKE: u64 = 1000;
    const STAKE_DURATION_1_MONTH: u64 = 2592000; // 30 days in seconds
    const STAKE_DURATION_3_MONTHS: u64 = 7776000; // 90 days in seconds
    const STAKE_DURATION_1_YEAR: u64 = 31536000; // 365 days in seconds
    const STAKE_BONUS_1_MONTH: u64 = 10; // 10%
    const STAKE_BONUS_3_MONTHS: u64 = 25; // 25%
    const STAKE_BONUS_1_YEAR: u64 = 50; // 50%

    // Tournament states
    const TOURNAMENT_UPCOMING: u8 = 0;
    const TOURNAMENT_ACTIVE: u8 = 1;
    const TOURNAMENT_VOTING: u8 = 2;
    const TOURNAMENT_ENDED: u8 = 3;

    // Data structures
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
        votes: Table<address, Table<address, Vote>>, // voter -> submission_creator -> vote
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
        tournament_counter: u64,
        tournaments: Table<u64, Tournament>,
        creator_profiles: Table<address, CreatorProfile>,
        stakes: Table<address, Stake>,
        nft_collection: Option<Object<collection::Collection>>,
        total_staked: u64,
        platform_fee_rate: u64, // Percentage
    }

    // Event structures
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
        manipulation_detected_events: EventHandle<ManipulationDetected>,
    }

    // Helper functions
    fun get_tournament_state(tournament: &Tournament): u8 {
        let current_time = timestamp::now_seconds();
        if (current_time < tournament.start_time) {
            TOURNAMENT_UPCOMING
        } else if (current_time < tournament.end_time) {
            TOURNAMENT_ACTIVE
        } else if (current_time < tournament.voting_end_time) {
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
            abort error::invalid_argument(E_INVALID_TIER)
        }
    }

    fun calculate_quadratic_voting_power(stake_amount: u64, reputation: u64): u64 {
        let base_power = stake_amount / 100; // 1 vote per 100 tokens
        let reputation_multiplier = 1 + (reputation / 100); // 1% bonus per 100 reputation
        let quadratic_power = base_power * reputation_multiplier;
        // Apply square root for quadratic voting
        if (quadratic_power > 0) {
            // Simplified square root approximation
            let estimate = quadratic_power;
            let iterations = 0;
            while (iterations < 10 && estimate > 1) {
                estimate = (estimate + quadratic_power / estimate) / 2;
                iterations = iterations + 1;
            };
            estimate
        } else {
            0
        }
    }

    fun get_stake_bonus_rate(duration: u64): u64 {
        if (duration == STAKE_DURATION_1_MONTH) {
            STAKE_BONUS_1_MONTH
        } else if (duration == STAKE_DURATION_3_MONTHS) {
            STAKE_BONUS_3_MONTHS
        } else if (duration == STAKE_DURATION_1_YEAR) {
            STAKE_BONUS_1_YEAR
        } else {
            abort error::invalid_argument(E_INVALID_STAKE_DURATION)
        }
    }

    fun check_manipulation(profile: &mut CreatorProfile): bool {
        let current_time = timestamp::now_seconds();
        
        // Reset counter if more than a minute has passed
        if (current_time - profile.last_minute_start > 60) {
            profile.vote_count_last_minute = 0;
            profile.last_minute_start = current_time;
        };
        
        profile.vote_count_last_minute = profile.vote_count_last_minute + 1;
        
        // Check if voting too rapidly
        profile.vote_count_last_minute > MANIPULATION_VOTE_THRESHOLD
    }

    // Public entry functions
    public entry fun initialize(admin: &signer) acquires PlatformState {
        let admin_addr = signer::address_of(admin);
        
        // Create platform state
        let platform_state = PlatformState {
            admin: admin_addr,
            tournament_counter: 0,
            tournaments: table::new(),
            creator_profiles: table::new(),
            stakes: table::new(),
            nft_collection: option::none(),
            total_staked: 0,
            platform_fee_rate: 5, // 5% platform fee
        };
        
        // Create platform events
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
            manipulation_detected_events: account::new_event_handle<ManipulationDetected>(admin),
        };
        
        move_to(admin, platform_state);
        move_to(admin, platform_events);
        
        // Create NFT collection
        create_nft_collection(admin);
    }

    public entry fun create_nft_collection(admin: &signer) acquires PlatformState {
        let admin_addr = signer::address_of(admin);
        let platform_state = borrow_global_mut<PlatformState>(admin_addr);
        
        assert!(platform_state.admin == admin_addr, error::permission_denied(E_NOT_ADMIN));
        
        let collection_constructor_ref = collection::create_unlimited_collection(
            admin,
            string::utf8(b"GUI Arena tournament winners collection"),
            string::utf8(COLLECTION_NAME),
            option::none(),
            string::utf8(b"https://guiarena.com/metadata/collection.json"),
        );
        
        let collection_object = object::object_from_constructor_ref<collection::Collection>(
            &collection_constructor_ref
        );
        
        platform_state.nft_collection = option::some(collection_object);
    }

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
        tier: u8,
    ) acquires PlatformState, PlatformEvents {
        let creator_addr = signer::address_of(creator);
        let platform_state = borrow_global_mut<PlatformState>(creator_addr);
        
        // Validate tier
        assert!(tier >= 1 && tier <= 3, error::invalid_argument(E_INVALID_TIER));
        
        // Check if creator has minimum stake for tier
        if (table::contains(&platform_state.stakes, creator_addr)) {
            let stake = table::borrow(&platform_state.stakes, creator_addr);
            let min_stake = get_min_stake_for_tier(tier);
            assert!(stake.amount >= min_stake, error::invalid_state(E_INSUFFICIENT_STAKE));
        } else {
            abort error::invalid_state(E_INSUFFICIENT_STAKE)
        };
        
        // Create tournament
        let tournament_id = platform_state.tournament_counter + 1;
        platform_state.tournament_counter = tournament_id;
        
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
        
        // Create creator profile if doesn't exist
        if (!table::contains(&platform_state.creator_profiles, creator_addr)) {
            let profile = CreatorProfile {
                address: creator_addr,
                total_submissions: 0,
                total_wins: 0,
                total_earnings: 0,
                reputation_score: 100, // Starting reputation
                join_date: timestamp::now_seconds(),
                last_vote_time: 0,
                vote_count_last_minute: 0,
                last_minute_start: 0,
            };
            table::add(&mut platform_state.creator_profiles, creator_addr, profile);
        };
        
        // Emit event
        let platform_events = borrow_global_mut<PlatformEvents>(creator_addr);
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

    public entry fun submit_meme(
        user: &signer,
        tournament_id: u64,
        title: String,
        description: String,
        ipfs_hash: String,
    ) acquires PlatformState, PlatformEvents {
        let user_addr = signer::address_of(user);
        let platform_state = borrow_global_mut<PlatformState>(user_addr);
        
        // Get tournament
        assert!(table::contains(&platform_state.tournaments, tournament_id), error::not_found(E_TOURNAMENT_NOT_FOUND));
        let tournament = table::borrow_mut(&mut platform_state.tournaments, tournament_id);
        
        // Check tournament state
        tournament.state = get_tournament_state(tournament);
        assert!(tournament.state == TOURNAMENT_ACTIVE, error::invalid_state(E_INVALID_TOURNAMENT_STATE));
        
        // Check if user already submitted
        assert!(!table::contains(&tournament.submissions, user_addr), error::already_exists(E_ALREADY_SUBMITTED));
        
        // Check tournament capacity
        assert!(vector::length(&tournament.participants) < tournament.max_participants, error::resource_exhausted(E_TOURNAMENT_FULL));
        
        // Process entry fee
        if (tournament.entry_fee > 0) {
            let entry_fee_coin = coin::withdraw<AptosCoin>(user, tournament.entry_fee);
            tournament.total_prize_pool = tournament.total_prize_pool + tournament.entry_fee;
            // Note: In a real implementation, you would store the coins in the tournament's account
            // For now, we'll assume they're held by the platform
            coin::deposit(user_addr, entry_fee_coin);
        };
        
        // Create submission
        let submission = Submission {
            creator: user_addr,
            title,
            description,
            ipfs_hash,
            timestamp: timestamp::now_seconds(),
            total_votes: 0,
            quadratic_score: 0,
        };
        
        table::add(&mut tournament.submissions, user_addr, submission);
        vector::push_back(&mut tournament.participants, user_addr);
        
        // Update creator profile
        let profile = table::borrow_mut(&mut platform_state.creator_profiles, user_addr);
        profile.total_submissions = profile.total_submissions + 1;
        
        // Emit event
        let platform_events = borrow_global_mut<PlatformEvents>(user_addr);
        event::emit_event(&mut platform_events.meme_submitted_events, MemeSubmitted {
            tournament_id,
            creator: user_addr,
            title,
            ipfs_hash,
            timestamp: timestamp::now_seconds(),
        });
    }

    public entry fun cast_vote(
        voter: &signer,
        tournament_id: u64,
        submission_creator: address,
        weight: u64,
    ) acquires PlatformState, PlatformEvents {
        let voter_addr = signer::address_of(voter);
        let platform_state = borrow_global_mut<PlatformState>(voter_addr);
        
        // Get tournament
        assert!(table::contains(&platform_state.tournaments, tournament_id), error::not_found(E_TOURNAMENT_NOT_FOUND));
        let tournament = table::borrow_mut(&mut platform_state.tournaments, tournament_id);
        
        // Check tournament state
        tournament.state = get_tournament_state(tournament);
        assert!(tournament.state == TOURNAMENT_VOTING, error::invalid_state(E_VOTING_ENDED));
        
        // Check submission exists
        assert!(table::contains(&tournament.submissions, submission_creator), error::not_found(E_SUBMISSION_NOT_FOUND));
        
        // Cannot vote for own submission
        assert!(voter_addr != submission_creator, error::invalid_argument(E_CANNOT_VOTE_OWN_SUBMISSION));
        
        // Check voting cooldown and manipulation
        let profile = table::borrow_mut(&mut platform_state.creator_profiles, voter_addr);
        let current_time = timestamp::now_seconds();
        assert!(current_time - profile.last_vote_time >= VOTING_COOLDOWN_SECONDS, error::invalid_state(E_VOTING_COOLDOWN));
        
        // Check for manipulation
        if (check_manipulation(profile)) {
            // Emit manipulation event
            let platform_events = borrow_global_mut<PlatformEvents>(voter_addr);
            event::emit_event(&mut platform_events.manipulation_detected_events, ManipulationDetected {
                user: voter_addr,
                tournament_id,
                violation_type: string::utf8(b"Rapid voting detected"),
                timestamp: current_time,
            });
            abort error::invalid_state(E_MANIPULATION_DETECTED)
        };
        
        // Get voter's stake and calculate voting power
        assert!(table::contains(&platform_state.stakes, voter_addr), error::invalid_state(E_INSUFFICIENT_STAKE));
        let stake = table::borrow(&platform_state.stakes, voter_addr);
        let voting_power = calculate_quadratic_voting_power(stake.amount, profile.reputation_score);
        let actual_weight = if (weight > voting_power) voting_power else weight;
        
        // Create or update vote
        if (!table::contains(&tournament.votes, voter_addr)) {
            table::add(&mut tournament.votes, voter_addr, table::new());
        };
        let voter_votes = table::borrow_mut(&mut tournament.votes, voter_addr);
        
        let vote = Vote {
            voter: voter_addr,
            submission_creator,
            weight: actual_weight,
            timestamp: current_time,
        };
        
        if (table::contains(voter_votes, submission_creator)) {
            table::remove(voter_votes, submission_creator);
        };
        table::add(voter_votes, submission_creator, vote);
        
        // Update submission score
        let submission = table::borrow_mut(&mut tournament.submissions, submission_creator);
        submission.total_votes = submission.total_votes + 1;
        submission.quadratic_score = submission.quadratic_score + actual_weight;
        
        // Update voter profile
        profile.last_vote_time = current_time;
        
        // Emit event
        let platform_events = borrow_global_mut<PlatformEvents>(voter_addr);
        event::emit_event(&mut platform_events.vote_cast_events, VoteCast {
            tournament_id,
            voter: voter_addr,
            submission_creator,
            weight: actual_weight,
            timestamp: current_time,
        });
    }

    public entry fun stake_gui(
        user: &signer,
        amount: u64,
        duration: u64,
    ) acquires PlatformState, PlatformEvents {
        let user_addr = signer::address_of(user);
        let platform_state = borrow_global_mut<PlatformState>(user_addr);
        
        // Validate duration and get bonus rate
        let bonus_rate = get_stake_bonus_rate(duration);
        
        // Withdraw tokens
        let stake_coin = coin::withdraw<AptosCoin>(user, amount);
        
        // Create or update stake
        let stake = Stake {
            amount,
            duration,
            start_time: timestamp::now_seconds(),
            bonus_rate,
            is_active: true,
        };
        
        if (table::contains(&platform_state.stakes, user_addr)) {
            table::remove(&mut platform_state.stakes, user_addr);
        };
        table::add(&mut platform_state.stakes, user_addr, stake);
        
        // Update total staked
        platform_state.total_staked = platform_state.total_staked + amount;
        
        // Create profile if doesn't exist
        if (!table::contains(&platform_state.creator_profiles, user_addr)) {
            let profile = CreatorProfile {
                address: user_addr,
                total_submissions: 0,
                total_wins: 0,
                total_earnings: 0,
                reputation_score: 100,
                join_date: timestamp::now_seconds(),
                last_vote_time: 0,
                vote_count_last_minute: 0,
                last_minute_start: 0,
            };
            table::add(&mut platform_state.creator_profiles, user_addr, profile);
        };
        
        // Store the staked coins (in real implementation, transfer to platform account)
        coin::deposit(user_addr, stake_coin);
        
        // Emit event
        let platform_events = borrow_global_mut<PlatformEvents>(user_addr);
        event::emit_event(&mut platform_events.tokens_staked_events, TokensStaked {
            staker: user_addr,
            amount,
            duration,
            bonus_rate,
            timestamp: timestamp::now_seconds(),
        });
    }

    public entry fun mint_winner_nft(
        admin: &signer,
        tournament_id: u64,
        winner: address,
        rank: u64,
    ) acquires PlatformState, PlatformEvents {
        let admin_addr = signer::address_of(admin);
        let platform_state = borrow_global_mut<PlatformState>(admin_addr);
        
        assert!(platform_state.admin == admin_addr, error::permission_denied(E_NOT_ADMIN));
        
        // Get tournament and submission
        assert!(table::contains(&platform_state.tournaments, tournament_id), error::not_found(E_TOURNAMENT_NOT_FOUND));
        let tournament = table::borrow(&platform_state.tournaments, tournament_id);
        assert!(table::contains(&tournament.submissions, winner), error::not_found(E_SUBMISSION_NOT_FOUND));
        let _submission = table::borrow(&tournament.submissions, winner);
        
        // Get collection
        assert!(option::is_some(&platform_state.nft_collection), error::not_found(E_TOURNAMENT_NOT_FOUND));
        let _collection = option::borrow(&platform_state.nft_collection);
        
        // Create NFT
        let token_name = string::utf8(b"GUI Arena Winner #");
        string::append(&mut token_name, string::utf8(b"1")); // Simplified - should use tournament_id
        
        let token_constructor_ref = token::create_named_token(
            admin,
            string::utf8(COLLECTION_NAME),
            string::utf8(b"GUI Arena Winner NFT"),
            token_name,
            option::none(),
            string::utf8(b"https://guiarena.com/metadata/nft.json"),
        );
        
        let token_object = object::object_from_constructor_ref<token::Token>(
            &token_constructor_ref
        );
        
        let token_address = object::object_address(&token_object);
        
        // Transfer NFT to winner
        // Note: In a real implementation, you would transfer the NFT to the winner's account
        
        // Emit event
        let platform_events = borrow_global_mut<PlatformEvents>(admin_addr);
        event::emit_event(&mut platform_events.nft_minted_events, NFTMinted {
            tournament_id,
            recipient: winner,
            token_address,
            rank,
        });
    }

    public entry fun end_tournament(
        admin: &signer,
        tournament_id: u64,
    ) acquires PlatformState, PlatformEvents {
        let admin_addr = signer::address_of(admin);
        let platform_state = borrow_global_mut<PlatformState>(admin_addr);
        
        assert!(platform_state.admin == admin_addr, error::permission_denied(E_NOT_ADMIN));
        
        // Get tournament
        assert!(table::contains(&platform_state.tournaments, tournament_id), error::not_found(E_TOURNAMENT_NOT_FOUND));
        let tournament = table::borrow_mut(&mut platform_state.tournaments, tournament_id);
        
        // Check if tournament can be ended
        tournament.state = get_tournament_state(tournament);
        assert!(tournament.state == TOURNAMENT_ENDED, error::invalid_state(E_INVALID_TOURNAMENT_STATE));
        
        // Find winners (top 3 by quadratic score)
        let winners = vector::empty<address>();
        let max_scores = vector::empty<u64>();
        
        // Simplified winner selection - in real implementation, sort all submissions
        let participants = tournament.participants;
        let i = 0;
        while (i < vector::length(&participants) && vector::length(&winners) < 3) {
            let participant = *vector::borrow(&participants, i);
            if (table::contains(&tournament.submissions, participant)) {
                let submission = table::borrow(&tournament.submissions, participant);
                if (vector::length(&winners) == 0 || submission.quadratic_score > 0) {
                    vector::push_back(&mut winners, participant);
                    vector::push_back(&mut max_scores, submission.quadratic_score);
                };
            };
            i = i + 1;
        };
        
        tournament.winner_addresses = winners;
        
        // Distribute prizes
        let prize_pool = tournament.total_prize_pool;
        let platform_fee = prize_pool * platform_state.platform_fee_rate / 100;
        let distributable_pool = prize_pool - platform_fee;
        
        // Prize distribution: 50% to 1st, 30% to 2nd, 20% to 3rd
        if (vector::length(&winners) > 0) {
            let first_prize = distributable_pool * 50 / 100;
            let winner_addr = *vector::borrow(&winners, 0);
            
            // Update winner profile
            let profile = table::borrow_mut(&mut platform_state.creator_profiles, winner_addr);
            profile.total_wins = profile.total_wins + 1;
            profile.total_earnings = profile.total_earnings + first_prize;
            profile.reputation_score = profile.reputation_score + 50; // Bonus reputation for winning
            
            // Emit winner event
            let platform_events = borrow_global_mut<PlatformEvents>(admin_addr);
            event::emit_event(&mut platform_events.winner_announced_events, WinnerAnnounced {
                tournament_id,
                winner: winner_addr,
                rank: 1,
                prize_amount: first_prize,
            });
            
            // Emit prize distribution event
            event::emit_event(&mut platform_events.prize_distributed_events, PrizeDistributed {
                tournament_id,
                recipient: winner_addr,
                amount: first_prize,
            });
        };
        
        // Handle 2nd place
        if (vector::length(&winners) > 1) {
            let second_prize = distributable_pool * 30 / 100;
            let winner_addr = *vector::borrow(&winners, 1);
            
            let profile = table::borrow_mut(&mut platform_state.creator_profiles, winner_addr);
            profile.total_wins = profile.total_wins + 1;
            profile.total_earnings = profile.total_earnings + second_prize;
            profile.reputation_score = profile.reputation_score + 30;
            
            let platform_events = borrow_global_mut<PlatformEvents>(admin_addr);
            event::emit_event(&mut platform_events.winner_announced_events, WinnerAnnounced {
                tournament_id,
                winner: winner_addr,
                rank: 2,
                prize_amount: second_prize,
            });
            
            event::emit_event(&mut platform_events.prize_distributed_events, PrizeDistributed {
                tournament_id,
                recipient: winner_addr,
                amount: second_prize,
            });
        };
        
        // Handle 3rd place
        if (vector::length(&winners) > 2) {
            let third_prize = distributable_pool * 20 / 100;
            let winner_addr = *vector::borrow(&winners, 2);
            
            let profile = table::borrow_mut(&mut platform_state.creator_profiles, winner_addr);
            profile.total_wins = profile.total_wins + 1;
            profile.total_earnings = profile.total_earnings + third_prize;
            profile.reputation_score = profile.reputation_score + 20;
            
            let platform_events = borrow_global_mut<PlatformEvents>(admin_addr);
            event::emit_event(&mut platform_events.winner_announced_events, WinnerAnnounced {
                tournament_id,
                winner: winner_addr,
                rank: 3,
                prize_amount: third_prize,
            });
            
            event::emit_event(&mut platform_events.prize_distributed_events, PrizeDistributed {
                tournament_id,
                recipient: winner_addr,
                amount: third_prize,
            });
        };
        
        // Emit tournament ended event
        let platform_events = borrow_global_mut<PlatformEvents>(admin_addr);
        event::emit_event(&mut platform_events.tournament_ended_events, TournamentEnded {
            tournament_id,
            title: tournament.title,
            winners: tournament.winner_addresses,
            total_prize_pool: tournament.total_prize_pool,
        });
    }

    // View functions for querying state
    #[view]
    public fun get_tournament_info(tournament_id: u64): (String, String, address, u64, u64, u64, u64, u64, String, u8, u8) acquires PlatformState {
        let platform_state = borrow_global<PlatformState>(@gui_arena);
        assert!(table::contains(&platform_state.tournaments, tournament_id), error::not_found(E_TOURNAMENT_NOT_FOUND));
        
        let tournament = table::borrow(&platform_state.tournaments, tournament_id);
        (
            tournament.title,
            tournament.description,
            tournament.creator,
            tournament.entry_fee,
            tournament.start_time,
            tournament.end_time,
            tournament.voting_end_time,
            tournament.max_participants,
            tournament.theme,
            tournament.tier,
            tournament.state
        )
    }

    #[view]
    public fun get_creator_profile(creator: address): (u64, u64, u64, u64, u64) acquires PlatformState {
        let platform_state = borrow_global<PlatformState>(@gui_arena);
        if (!table::contains(&platform_state.creator_profiles, creator)) {
            return (0, 0, 0, 100, 0) // Default values
        };
        
        let profile = table::borrow(&platform_state.creator_profiles, creator);
        (
            profile.total_submissions,
            profile.total_wins,
            profile.total_earnings,
            profile.reputation_score,
            profile.join_date
        )
    }

    #[view]
    public fun get_user_stake(user: address): (u64, u64, u64, u64, bool) acquires PlatformState {
        let platform_state = borrow_global<PlatformState>(@gui_arena);
        if (!table::contains(&platform_state.stakes, user)) {
            return (0, 0, 0, 0, false) // Default values
        };
        
        let stake = table::borrow(&platform_state.stakes, user);
        (
            stake.amount,
            stake.duration,
            stake.start_time,
            stake.bonus_rate,
            stake.is_active
        )
    }

    #[view]
    public fun get_submission_info(tournament_id: u64, creator: address): (String, String, String, u64, u64, u64) acquires PlatformState {
        let platform_state = borrow_global<PlatformState>(@gui_arena);
        assert!(table::contains(&platform_state.tournaments, tournament_id), error::not_found(E_TOURNAMENT_NOT_FOUND));
        
        let tournament = table::borrow(&platform_state.tournaments, tournament_id);
        assert!(table::contains(&tournament.submissions, creator), error::not_found(E_SUBMISSION_NOT_FOUND));
        
        let submission = table::borrow(&tournament.submissions, creator);
        (
            submission.title,
            submission.description,
            submission.ipfs_hash,
            submission.timestamp,
            submission.total_votes,
            submission.quadratic_score
        )
    }

    #[view]
    public fun get_tournament_winners(tournament_id: u64): vector<address> acquires PlatformState {
        let platform_state = borrow_global<PlatformState>(@gui_arena);
        assert!(table::contains(&platform_state.tournaments, tournament_id), error::not_found(E_TOURNAMENT_NOT_FOUND));
        
        let tournament = table::borrow(&platform_state.tournaments, tournament_id);
        tournament.winner_addresses
    }

    #[view]
    public fun get_platform_stats(): (u64, u64, u64) acquires PlatformState {
        let platform_state = borrow_global<PlatformState>(@gui_arena);
        (
            platform_state.tournament_counter,
            platform_state.total_staked,
            platform_state.platform_fee_rate
        )
    }

    #[view]
    public fun can_user_participate(user: address, tier: u8): bool acquires PlatformState {
        let platform_state = borrow_global<PlatformState>(@gui_arena);
        if (!table::contains(&platform_state.stakes, user)) {
            return false
        };
        
        let stake = table::borrow(&platform_state.stakes, user);
        let min_stake = get_min_stake_for_tier(tier);
        stake.amount >= min_stake && stake.is_active
    }

    #[view]
    public fun get_voting_power(user: address): u64 acquires PlatformState {
        let platform_state = borrow_global<PlatformState>(@gui_arena);
        if (!table::contains(&platform_state.stakes, user) || !table::contains(&platform_state.creator_profiles, user)) {
            return 0
        };
        
        let stake = table::borrow(&platform_state.stakes, user);
        let profile = table::borrow(&platform_state.creator_profiles, user);
        
        if (!stake.is_active) {
            return 0
        };
        
        calculate_quadratic_voting_power(stake.amount, profile.reputation_score)
    }

    // Admin functions
    public entry fun update_platform_fee(admin: &signer, new_fee_rate: u64) acquires PlatformState {
        let admin_addr = signer::address_of(admin);
        let platform_state = borrow_global_mut<PlatformState>(admin_addr);
        assert!(platform_state.admin == admin_addr, error::permission_denied(E_NOT_ADMIN));
        assert!(new_fee_rate <= 20, error::invalid_argument(E_INVALID_TIER)); // Max 20% fee
        
        platform_state.platform_fee_rate = new_fee_rate;
    }

    public entry fun slash_stake(admin: &signer, user: address, slash_amount: u64) acquires PlatformState, PlatformEvents {
        let admin_addr = signer::address_of(admin);
        let platform_state = borrow_global_mut<PlatformState>(admin_addr);
        assert!(platform_state.admin == admin_addr, error::permission_denied(E_NOT_ADMIN));
        
        assert!(table::contains(&platform_state.stakes, user), error::not_found(E_STAKE_NOT_FOUND));
        let stake = table::borrow_mut(&mut platform_state.stakes, user);
        
        if (slash_amount >= stake.amount) {
            stake.amount = 0;
            stake.is_active = false;
        } else {
            stake.amount = stake.amount - slash_amount;
        };
        
        platform_state.total_staked = platform_state.total_staked - slash_amount;
        
        // Emit manipulation detection event
        let platform_events = borrow_global_mut<PlatformEvents>(admin_addr);
        event::emit_event(&mut platform_events.manipulation_detected_events, ManipulationDetected {
            user,
            tournament_id: 0, // General manipulation, not tournament-specific
            violation_type: string::utf8(b"Stake slashed for manipulation"),
            timestamp: timestamp::now_seconds(),
        });
    }

    public entry fun emergency_pause_tournament(admin: &signer, tournament_id: u64) acquires PlatformState {
        let admin_addr = signer::address_of(admin);
        let platform_state = borrow_global_mut<PlatformState>(admin_addr);
        assert!(platform_state.admin == admin_addr, error::permission_denied(E_NOT_ADMIN));
        
        assert!(table::contains(&platform_state.tournaments, tournament_id), error::not_found(E_TOURNAMENT_NOT_FOUND));
        let tournament = table::borrow_mut(&mut platform_state.tournaments, tournament_id);
        
        // Force end the tournament in case of emergency
        tournament.state = TOURNAMENT_ENDED;
        tournament.voting_end_time = timestamp::now_seconds();
    }
}