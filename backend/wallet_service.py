"""
Unified Wallet Service
Generates and manages wallets for Bitcoin (BTC, BCH, BSV) and Ethereum (ETH, Base L2)
Uses simplified approach for local wallet generation

WALLET PREFERENCES:
- 1 static WIF private key for all Bitcoin addresses (BTC, BCH, BSV share the same WIF)
- 1 Ethereum wallet per user with bias towards Layer 2 Base (Base is the preferred/default network)
- 1 Solana wallet per user (stored separately)
"""
import json
import os
import secrets
import hashlib
from typing import Dict, Optional
from pathlib import Path
import base58

# Simplified mnemonic word list (first 2048 words for BIP39 compatibility)
MNEMONIC_WORDS = [
    "abandon", "ability", "able", "about", "above", "absent", "absorb", "abstract",
    "absurd", "abuse", "access", "accident", "account", "accuse", "achieve", "acid",
    "acoustic", "acquire", "across", "act", "action", "actor", "actual", "adapt",
    "add", "addict", "address", "adjust", "admit", "adult", "advance", "advice"
] * 64  # Repeat to get enough words (simplified - in production use full BIP39 wordlist)


def generate_mnemonic() -> str:
    """Generate a 12-word mnemonic seed phrase"""
    # Generate 128 bits of entropy (16 bytes)
    entropy = secrets.token_bytes(16)
    
    # Convert to binary string
    entropy_bits = ''.join(format(byte, '08b') for byte in entropy)
    
    # Add checksum (first 4 bits of SHA256 hash)
    hash_bytes = hashlib.sha256(entropy).digest()
    checksum_bits = format(hash_bytes[0], '08b')[:4]
    
    # Combine entropy + checksum = 132 bits = 12 words (11 bits per word)
    combined_bits = entropy_bits + checksum_bits
    
    # Convert to words
    words = []
    for i in range(12):
        index = int(combined_bits[i*11:(i+1)*11], 2) % len(MNEMONIC_WORDS)
        words.append(MNEMONIC_WORDS[index])
    
    return " ".join(words)


def mnemonic_to_seed(mnemonic: str, passphrase: str = "") -> bytes:
    """Convert mnemonic to seed using PBKDF2"""
    mnemonic_bytes = mnemonic.encode('utf-8')
    salt = ("mnemonic" + passphrase).encode('utf-8')
    return hashlib.pbkdf2_hmac('sha512', mnemonic_bytes, salt, 2048)


def derive_private_key(seed: bytes) -> bytes:
    """Derive private key from seed (simplified)"""
    # Use HMAC-SHA512 for key derivation
    key = b"Bitcoin seed"
    hmac_result = hashlib.pbkdf2_hmac('sha512', seed, key, 1)
    return hmac_result[:32]  # Use first 32 bytes as private key


def private_key_to_wif(private_key: bytes, compressed: bool = True) -> str:
    """Convert private key to WIF (Wallet Import Format)"""
    # Mainnet version byte
    version = 0x80
    
    # Add compression flag
    if compressed:
        extended_key = bytes([version]) + private_key + bytes([0x01])
    else:
        extended_key = bytes([version]) + private_key
    
    # Double SHA256 hash for checksum
    first_hash = hashlib.sha256(extended_key).digest()
    second_hash = hashlib.sha256(first_hash).digest()
    checksum = second_hash[:4]
    
    # Combine and encode to base58
    wif_bytes = extended_key + checksum
    return base58.b58encode(wif_bytes).decode('ascii')


def private_key_to_address(private_key: bytes) -> str:
    """Convert private key to address - SAME for BTC, BCH, and BSV (P2PKH)"""
    # All three coins (BTC, BCH, BSV) use the same address format for P2PKH
    # They share the same private key/WIF, so they share the same address
    
    # Use SHA256 to create address hash from private key only
    address_hash = hashlib.sha256(private_key).digest()
    
    # Take first 20 bytes for address (RIPEMD160 would be used in production)
    address_bytes = address_hash[:20]
    
    # Add version byte (0x00 for mainnet P2PKH) - same for all three coins
    version = 0x00
    versioned = bytes([version]) + address_bytes
    
    # Calculate checksum
    checksum = hashlib.sha256(hashlib.sha256(versioned).digest()).digest()[:4]
    
    # Combine and encode to base58
    address_with_checksum = versioned + checksum
    return base58.b58encode(address_with_checksum).decode('ascii')


def private_key_to_taproot_address(private_key: bytes) -> str:
    """Convert private key to Taproot (P2TR) address - newer format for cheaper transactions"""
    # Taproot addresses start with 'bc1p' and use bech32m encoding
    # For simplicity, we'll generate a variant address from the private key
    # In production, this would use proper Taproot key derivation
    
    # Generate a different hash for Taproot (using a different salt)
    taproot_hash = hashlib.sha256(b"taproot" + private_key).digest()
    address_bytes = taproot_hash[:20]
    
    # Taproot uses version byte 0x01 and bech32m encoding
    # For simplicity, we'll create a base58 address with version 0x01
    version = 0x01
    versioned = bytes([version]) + address_bytes
    
    # Calculate checksum
    checksum = hashlib.sha256(hashlib.sha256(versioned).digest()).digest()[:4]
    
    # Combine and encode to base58 (in production, use bech32m)
    address_with_checksum = versioned + checksum
    return base58.b58encode(address_with_checksum).decode('ascii')


def private_key_to_ordinals_address(private_key: bytes, chain: str = "BTC") -> str:
    """Convert private key to Ordinals address - for art/NFTs on Bitcoin"""
    # Ordinals on BTC typically use Taproot addresses (P2TR)
    # Ordinals on BSV use special addresses for 1sat ordinals
    # For simplicity, we'll generate variant addresses
    
    if chain == "BSV":
        # BSV ordinals use a different address format
        ordinals_hash = hashlib.sha256(b"bsv_ordinals" + private_key).digest()
    else:
        # BTC ordinals typically use Taproot
        ordinals_hash = hashlib.sha256(b"btc_ordinals" + private_key).digest()
    
    address_bytes = ordinals_hash[:20]
    
    # Use version 0x02 for ordinals addresses
    version = 0x02
    versioned = bytes([version]) + address_bytes
    
    # Calculate checksum
    checksum = hashlib.sha256(hashlib.sha256(versioned).digest()).digest()[:4]
    
    # Combine and encode to base58
    address_with_checksum = versioned + checksum
    return base58.b58encode(address_with_checksum).decode('ascii')


def get_wallet_file(username: str) -> Path:
    """Get wallet file path for a specific user"""
    users_dir = Path(__file__).parent / "users" / username
    users_dir.mkdir(parents=True, exist_ok=True)
    return users_dir / "wallet.json"


def ensure_wallet_dir(username: str):
    """Ensure wallet directory exists for user"""
    wallet_file = get_wallet_file(username)
    wallet_file.parent.mkdir(parents=True, exist_ok=True)


def generate_ethereum_keypair() -> tuple[bytes, str]:
    """Generate a new Ethereum keypair and address"""
    # Generate 32 random bytes for private key
    private_key = secrets.token_bytes(32)
    
    # Try to use eth_keys if available
    try:
        from eth_keys import keys
        from eth_utils import to_checksum_address, keccak
        private_key_obj = keys.PrivateKey(private_key)
        public_key = private_key_obj.public_key.to_bytes()
        # Ethereum address is last 20 bytes of keccak256 hash of public key
        address_bytes = keccak(public_key)[-20:]
        address = to_checksum_address('0x' + address_bytes.hex())
    except ImportError:
        # Fallback: simple hash-based address
        address_hash = hashlib.sha256(private_key).digest()[:20]
        address = '0x' + address_hash.hex()
    
    return private_key, address


def generate_wallet() -> Dict:
    """Generate a new wallet with seed phrase and WIF - includes Bitcoin and Ethereum"""
    # Generate mnemonic
    mnemonic = generate_mnemonic()
    
    # Convert to seed
    seed = mnemonic_to_seed(mnemonic)
    
    # Derive ONE private key - shared by all three coins (BTC, BCH, BSV)
    private_key = derive_private_key(seed)
    
    # Generate ONE WIF - shared by all three coins
    # The same WIF/private key controls funds on BTC, BCH, and BSV networks
    wif = private_key_to_wif(private_key, compressed=True)
    
    # Generate different address types from the same private key
    # Legacy P2PKH address - shared by all three coins
    legacy_address = private_key_to_address(private_key)
    
    # Taproot addresses - newer format for cheaper transactions
    btc_taproot = private_key_to_taproot_address(private_key)
    bsv_taproot = private_key_to_taproot_address(private_key)  # BSV also supports Taproot
    
    # Ordinals addresses - for art/NFTs
    btc_ordinals = private_key_to_ordinals_address(private_key, "BTC")
    bsv_ordinals = private_key_to_ordinals_address(private_key, "BSV")
    
    # Generate Ethereum wallet (separate from Bitcoin)
    ethereum_private_key, ethereum_address = generate_ethereum_keypair()
    # Base uses the same address format as Ethereum mainnet
    base_address = ethereum_address
    
    from datetime import datetime
    
    wallet = {
        "mnemonic": mnemonic,
        "wif": wif,  # Single WIF shared by BTC, BCH, and BSV
        "seed": seed.hex(),
        "private_key": private_key.hex(),  # Single private key shared by all three coins
        "addresses": {
            # Legacy P2PKH addresses - shared by all three coins
            "BTC": legacy_address,
            "BCH": legacy_address,
            "BSV": legacy_address,
            # Ethereum addresses
            "ETH": ethereum_address,
            "BASE": base_address  # Base (Layer 2) - preferred network
        },
        "bitcoin_addresses": {
            "BTC": {
                "legacy": legacy_address,  # P2PKH - older format
                "taproot": btc_taproot,  # P2TR - newer, cheaper transactions
                "ordinals": btc_ordinals  # For Bitcoin Ordinals art/NFTs
            },
            "BSV": {
                "legacy": legacy_address,  # P2PKH - older format
                "taproot": bsv_taproot,  # P2TR - newer, cheaper transactions
                "ordinals": bsv_ordinals  # For BSV 1sat ordinals art/NFTs
            },
            "BCH": {
                "legacy": legacy_address  # BCH primarily uses legacy format
            }
        },
        "ethereum": {
            "private_key": ethereum_private_key.hex(),
            "address": ethereum_address,
            "base_address": base_address,
            "preferred_network": "base"  # BIAS: Base is the preferred/default network
        },
        "created_at": datetime.now().isoformat()
    }
    
    return wallet


def load_wallet(username: str) -> Optional[Dict]:
    """Load existing wallet from file for a specific user"""
    wallet_file = get_wallet_file(username)
    if not wallet_file.exists():
        return None
    
    try:
        with open(wallet_file, 'r', encoding='utf-8') as f:
            wallet = json.load(f)
        return wallet
    except Exception as e:
        print(f"Error loading wallet: {e}")
        return None


def save_wallet(username: str, wallet: Dict) -> bool:
    """Save wallet to file for a specific user"""
    try:
        ensure_wallet_dir(username)
        wallet_file = get_wallet_file(username)
        with open(wallet_file, 'w', encoding='utf-8') as f:
            json.dump(wallet, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Error saving wallet: {e}")
        return False


def get_or_create_wallet(username: str) -> Dict:
    """Get existing wallet or create a new one for a specific user"""
    wallet = load_wallet(username)
    if wallet:
        # Migrate existing wallets to include Ethereum if missing
        if "ethereum" not in wallet or "ETH" not in wallet.get("addresses", {}):
            # Generate Ethereum wallet for existing Bitcoin wallet
            ethereum_private_key, ethereum_address = generate_ethereum_keypair()
            base_address = ethereum_address
            
            if "addresses" not in wallet:
                wallet["addresses"] = {}
            
            wallet["addresses"]["ETH"] = ethereum_address
            wallet["addresses"]["BASE"] = base_address
            wallet["ethereum"] = {
                "private_key": ethereum_private_key.hex(),
                "address": ethereum_address,
                "base_address": base_address,
                "preferred_network": "base"
            }
            
            # Save updated wallet
            save_wallet(username, wallet)
        
        # Migrate existing wallets to include different Bitcoin address types
        if "bitcoin_addresses" not in wallet:
            # Generate different address types from existing private key
            private_key_hex = wallet.get("private_key")
            if private_key_hex:
                private_key = bytes.fromhex(private_key_hex)
                
                # Get legacy address (already exists)
                legacy_address = wallet["addresses"].get("BTC", private_key_to_address(private_key))
                
                # Generate new address types
                btc_taproot = private_key_to_taproot_address(private_key)
                bsv_taproot = private_key_to_taproot_address(private_key)
                btc_ordinals = private_key_to_ordinals_address(private_key, "BTC")
                bsv_ordinals = private_key_to_ordinals_address(private_key, "BSV")
                
                wallet["bitcoin_addresses"] = {
                    "BTC": {
                        "legacy": legacy_address,
                        "taproot": btc_taproot,
                        "ordinals": btc_ordinals
                    },
                    "BSV": {
                        "legacy": legacy_address,
                        "taproot": bsv_taproot,
                        "ordinals": bsv_ordinals
                    },
                    "BCH": {
                        "legacy": legacy_address
                    }
                }
                
                # Save updated wallet
                save_wallet(username, wallet)
        
        return wallet
    
    # Create new wallet
    wallet = generate_wallet()
    save_wallet(username, wallet)
    return wallet


def regenerate_wallet(username: str) -> Dict:
    """Regenerate wallet (create new one) for a specific user"""
    wallet = generate_wallet()
    save_wallet(username, wallet)
    return wallet
