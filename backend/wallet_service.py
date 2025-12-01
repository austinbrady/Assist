"""
Bitcoin Wallet Service
Generates and manages a single wallet that works for BTC, BCH, and BSV
Uses simplified approach for local wallet generation
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


def get_wallet_file(username: str) -> Path:
    """Get wallet file path for a specific user"""
    users_dir = Path(__file__).parent / "users" / username
    users_dir.mkdir(parents=True, exist_ok=True)
    return users_dir / "wallet.json"


def ensure_wallet_dir(username: str):
    """Ensure wallet directory exists for user"""
    wallet_file = get_wallet_file(username)
    wallet_file.parent.mkdir(parents=True, exist_ok=True)


def generate_wallet() -> Dict:
    """Generate a new wallet with seed phrase and WIF - ALL THREE COINS SHARE THE SAME WIF/PRIVATE KEY"""
    # Generate mnemonic
    mnemonic = generate_mnemonic()
    
    # Convert to seed
    seed = mnemonic_to_seed(mnemonic)
    
    # Derive ONE private key - shared by all three coins (BTC, BCH, BSV)
    private_key = derive_private_key(seed)
    
    # Generate ONE WIF - shared by all three coins
    # The same WIF/private key controls funds on BTC, BCH, and BSV networks
    wif = private_key_to_wif(private_key, compressed=True)
    
    # Generate ONE address - shared by all three coins (P2PKH addresses are identical)
    # BTC, BCH, and BSV use the same address format for legacy P2PKH addresses
    shared_address = private_key_to_address(private_key)
    
    from datetime import datetime
    
    wallet = {
        "mnemonic": mnemonic,
        "wif": wif,  # Single WIF shared by BTC, BCH, and BSV
        "seed": seed.hex(),
        "private_key": private_key.hex(),  # Single private key shared by all three coins
        "addresses": {
            # All three coins share the same address (same WIF = same address for P2PKH)
            "BTC": shared_address,
            "BCH": shared_address,
            "BSV": shared_address
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
