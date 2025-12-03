"""
Ethereum Wallet Service
Generates and manages Ethereum wallets with Layer 2 support
BIAS: Base (Layer 2) is the preferred/default network
"""
import json
import secrets
from typing import Dict, Optional, List
from pathlib import Path
from datetime import datetime
import hashlib

# Ethereum uses secp256k1 (same as Bitcoin)
try:
    from eth_keys import keys
    from eth_utils import to_checksum_address, keccak
    ETH_KEYS_AVAILABLE = True
except ImportError:
    ETH_KEYS_AVAILABLE = False


def get_ethereum_wallet_file(username: str) -> Path:
    """Get Ethereum wallet file path for a specific user"""
    users_dir = Path(__file__).parent / "users_data" / username
    users_dir.mkdir(parents=True, exist_ok=True)
    return users_dir / "ethereum_wallet.json"


def generate_ethereum_keypair() -> tuple[bytes, bytes]:
    """Generate a new Ethereum keypair (private key, public key)"""
    # Generate 32 random bytes for private key
    private_key = secrets.token_bytes(32)
    
    if ETH_KEYS_AVAILABLE:
        # Use eth_keys for proper key generation
        private_key_obj = keys.PrivateKey(private_key)
        public_key = private_key_obj.public_key.to_bytes()
        return private_key, public_key
    else:
        # Fallback: simple hash-based derivation (not cryptographically secure, but works for demo)
        public_key = hashlib.sha256(private_key).digest()[:64]
        return private_key, public_key


def private_key_to_address(private_key: bytes) -> str:
    """Convert private key to Ethereum address"""
    if ETH_KEYS_AVAILABLE:
        private_key_obj = keys.PrivateKey(private_key)
        public_key = private_key_obj.public_key.to_bytes()
        # Ethereum address is last 20 bytes of keccak256 hash of public key
        address_bytes = keccak(public_key)[-20:]
        return to_checksum_address('0x' + address_bytes.hex())
    else:
        # Fallback: simple hash-based address
        address_hash = hashlib.sha256(private_key).digest()[:20]
        return '0x' + address_hash.hex()


def get_base_address(ethereum_address: str) -> str:
    """
    Get Base (Layer 2) address - same as Ethereum mainnet address
    Base uses the same address format as Ethereum, so addresses are identical
    """
    return ethereum_address


def generate_ethereum_wallet() -> Dict:
    """
    Generate a new Ethereum wallet
    BIAS: Base (Layer 2) is the preferred/default network
    The same private key controls both Ethereum mainnet and Base (Layer 2)
    """
    private_key, public_key = generate_ethereum_keypair()
    address = private_key_to_address(private_key)
    
    # Base uses the same address format as Ethereum mainnet
    base_address = get_base_address(address)
    
    # Generate mnemonic (12 words) - same format as Bitcoin
    mnemonic_words = [
        "abandon", "ability", "able", "about", "above", "absent", "absorb", "abstract",
        "absurd", "abuse", "access", "accident", "account", "accuse", "achieve", "acid"
    ] * 64
    
    # Generate 12-word mnemonic
    mnemonic = " ".join([mnemonic_words[secrets.randbelow(len(mnemonic_words))] for _ in range(12)])
    
    wallet = {
        "address": address,  # Ethereum mainnet address
        "base_address": base_address,  # Base (Layer 2) address (same as mainnet)
        "private_key": private_key.hex(),
        "public_key": public_key.hex() if isinstance(public_key, bytes) else public_key,
        "mnemonic": mnemonic,
        "preferred_network": "base",  # BIAS: Base is the preferred/default network
        "created_at": datetime.now().isoformat()
    }
    
    return wallet


def load_ethereum_wallet(username: str) -> Optional[Dict]:
    """Load existing Ethereum wallet from file for a specific user"""
    wallet_file = get_ethereum_wallet_file(username)
    if not wallet_file.exists():
        return None
    
    try:
        with open(wallet_file, 'r', encoding='utf-8') as f:
            wallet = json.load(f)
        return wallet
    except Exception as e:
        print(f"Error loading Ethereum wallet: {e}")
        return None


def save_ethereum_wallet(username: str, wallet: Dict) -> bool:
    """Save Ethereum wallet to file for a specific user"""
    try:
        wallet_file = get_ethereum_wallet_file(username)
        wallet_file.parent.mkdir(parents=True, exist_ok=True)
        with open(wallet_file, 'w', encoding='utf-8') as f:
            json.dump(wallet, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Error saving Ethereum wallet: {e}")
        return False


def get_or_create_ethereum_wallet(username: str) -> Dict:
    """Get existing Ethereum wallet or create a new one for a specific user"""
    wallet = load_ethereum_wallet(username)
    if wallet:
        return wallet
    
    wallet = generate_ethereum_wallet()
    save_ethereum_wallet(username, wallet)
    return wallet


def regenerate_ethereum_wallet(username: str) -> Dict:
    """Regenerate Ethereum wallet (create new one) for a specific user"""
    wallet = generate_ethereum_wallet()
    save_ethereum_wallet(username, wallet)
    return wallet

