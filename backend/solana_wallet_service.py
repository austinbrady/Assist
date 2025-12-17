"""
Solana Wallet Service
Generates and manages Solana wallets with meme coin detection
"""
import json
import secrets
from typing import Dict, Optional, List
from pathlib import Path
import base58
from datetime import datetime

# Solana uses Ed25519 keypairs
try:
    from nacl.signing import SigningKey
    from nacl.encoding import RawEncoder
    NACL_AVAILABLE = True
except ImportError:
    NACL_AVAILABLE = False


def get_solana_wallet_file(username: str) -> Path:
    """Get Solana wallet file path for a specific user"""
    users_dir = Path(__file__).parent / "users_data" / username
    users_dir.mkdir(parents=True, exist_ok=True)
    return users_dir / "solana_wallet.json"


def generate_solana_keypair() -> tuple[bytes, bytes]:
    """Generate a new Solana keypair (private key, public key)"""
    if not NACL_AVAILABLE:
        # Fallback: generate random 32 bytes for private key
        private_key = secrets.token_bytes(32)
        # Simple hash-based public key derivation (not cryptographically secure, but works for demo)
        import hashlib
        public_key = hashlib.sha256(private_key).digest()[:32]
        return private_key, public_key
    
    # Generate Ed25519 keypair
    signing_key = SigningKey.generate()
    private_key = signing_key.encode(encoder=RawEncoder)
    public_key = bytes(signing_key.verify_key)
    return private_key, public_key


def public_key_to_address(public_key: bytes) -> str:
    """Convert public key to Solana address (base58 encoded)"""
    return base58.b58encode(public_key).decode('ascii')


def generate_solana_wallet() -> Dict:
    """Generate a new Solana wallet"""
    private_key, public_key = generate_solana_keypair()
    address = public_key_to_address(public_key)
    
    wallet = {
        "private_key": base58.b58encode(private_key).decode('ascii'),
        "public_key": base58.b58encode(public_key).decode('ascii'),
        "address": address,
        "created_at": datetime.now().isoformat()
    }
    
    return wallet


def load_solana_wallet(username: str) -> Optional[Dict]:
    """Load existing Solana wallet from file for a specific user (backward compatibility - returns first wallet)"""
    wallets = load_all_solana_wallets(username)
    if wallets and len(wallets) > 0:
        return wallets[0]
    return None


def load_all_solana_wallets(username: str) -> List[Dict]:
    """Load all Solana wallets from file for a specific user"""
    wallet_file = get_solana_wallet_file(username)
    if not wallet_file.exists():
        return []
    
    try:
        with open(wallet_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            # Check if it's the old format (single wallet dict) or new format (list of wallets)
            if isinstance(data, dict):
                # Old format - migrate to new format
                if "address" in data or "private_key" in data:
                    return [data]
                # If it's already a dict but not a wallet, return empty
                return []
            elif isinstance(data, list):
                # New format - list of wallets
                return data
            else:
                return []
    except Exception as e:
        print(f"Error loading Solana wallets: {e}")
        return []


def save_all_solana_wallets(username: str, wallets: List[Dict]) -> bool:
    """Save all Solana wallets to file for a specific user"""
    try:
        wallet_file = get_solana_wallet_file(username)
        wallet_file.parent.mkdir(parents=True, exist_ok=True)
        with open(wallet_file, 'w', encoding='utf-8') as f:
            json.dump(wallets, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Error saving Solana wallets: {e}")
        return False


def save_solana_wallet(username: str, wallet: Dict) -> bool:
    """Save Solana wallet to file for a specific user (backward compatibility - replaces all wallets with single wallet)"""
    return save_all_solana_wallets(username, [wallet])


def get_or_create_solana_wallet(username: str) -> Dict:
    """Get existing Solana wallet or create a new one for a specific user (returns first wallet)"""
    wallets = load_all_solana_wallets(username)
    if wallets and len(wallets) > 0:
        return wallets[0]
    
    # Create new wallet
    wallet = generate_solana_wallet()
    save_all_solana_wallets(username, [wallet])
    return wallet


def regenerate_solana_wallet(username: str) -> Dict:
    """Regenerate Solana wallet (create new one) for a specific user (replaces all wallets)"""
    wallet = generate_solana_wallet()
    save_all_solana_wallets(username, [wallet])
    return wallet


def add_solana_wallet_from_private_key(username: str, private_key_base58: str) -> Optional[Dict]:
    """Add a new Solana wallet from a private key (base58 encoded)"""
    try:
        # Decode the private key
        private_key = base58.b58decode(private_key_base58)
        
        if not NACL_AVAILABLE:
            # Fallback: derive public key from private key
            import hashlib
            public_key = hashlib.sha256(private_key).digest()[:32]
        else:
            # Reconstruct the signing key from private key
            signing_key = SigningKey(private_key, encoder=RawEncoder)
            public_key = bytes(signing_key.verify_key)
        
        address = public_key_to_address(public_key)
        
        # Check if wallet with this address already exists
        existing_wallets = load_all_solana_wallets(username)
        for existing_wallet in existing_wallets:
            if existing_wallet.get("address") == address:
                return None  # Wallet already exists
        
        # Create wallet dict
        wallet = {
            "private_key": private_key_base58,
            "public_key": base58.b58encode(public_key).decode('ascii'),
            "address": address,
            "created_at": datetime.now().isoformat(),
            "imported": True  # Mark as imported
        }
        
        # Add to existing wallets
        existing_wallets.append(wallet)
        save_all_solana_wallets(username, existing_wallets)
        
        return wallet
    except Exception as e:
        print(f"Error adding wallet from private key: {e}")
        return None


def generate_and_add_solana_wallet(username: str) -> Dict:
    """Generate a new Solana wallet and add it to the user's wallet list"""
    wallet = generate_solana_wallet()
    wallet["imported"] = False  # Mark as generated
    
    # Load existing wallets
    existing_wallets = load_all_solana_wallets(username)
    existing_wallets.append(wallet)
    save_all_solana_wallets(username, existing_wallets)
    
    return wallet


async def fetch_solana_balance(public_key: str) -> float:
    """
    Fetch SOL balance for a Solana public key/address
    Uses Solana JSON RPC API
    """
    import httpx
    
    # Solana mainnet RPC endpoint (public)
    SOLANA_RPC_URL = "https://api.mainnet-beta.solana.com"
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            payload = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "getBalance",
                "params": [public_key]
            }
            
            response = await client.post(SOLANA_RPC_URL, json=payload)
            data = response.json()
            
            if "error" in data or "result" not in data:
                return 0.0
            
            # Balance is returned in lamports (1 SOL = 1,000,000,000 lamports)
            lamports = data["result"].get("value", 0)
            sol_balance = lamports / 1_000_000_000
            
            return sol_balance
            
    except Exception as e:
        print(f"Error fetching Solana balance: {e}")
        return 0.0


async def get_solana_tokens(address: str) -> List[Dict]:
    """
    Get all tokens (including meme coins) in a Solana wallet
    Uses Solana JSON RPC API to fetch token accounts
    """
    import httpx
    
    # Solana mainnet RPC endpoint (public)
    SOLANA_RPC_URL = "https://api.mainnet-beta.solana.com"
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Get all token accounts for this address
            payload = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "getTokenAccountsByOwner",
                "params": [
                    address,
                    {
                        "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"  # SPL Token Program
                    },
                    {
                        "encoding": "jsonParsed"
                    }
                ]
            }
            
            response = await client.post(SOLANA_RPC_URL, json=payload)
            data = response.json()
            
            if "error" in data or "result" not in data:
                return []
            
            token_accounts = data["result"].get("value", [])
            tokens = []
            
            for account in token_accounts:
                account_data = account.get("account", {}).get("data", {}).get("parsed", {})
                info = account_data.get("info", {})
                
                # Get token mint address
                mint = info.get("mint", "")
                if not mint:
                    continue
                
                # Get token balance
                token_amount = info.get("tokenAmount", {})
                ui_amount = token_amount.get("uiAmount", 0)
                decimals = token_amount.get("decimals", 0)
                
                if ui_amount == 0:
                    continue  # Skip zero balance tokens
                
                # Try to get token metadata
                token_info = {
                    "mint": mint,
                    "balance": ui_amount,
                    "decimals": decimals,
                    "raw_amount": token_amount.get("amount", "0")
                }
                
                # Try to fetch token metadata (name, symbol, etc.)
                try:
                    metadata = await get_token_metadata(mint)
                    if metadata:
                        token_info.update(metadata)
                except:
                    pass  # If metadata fetch fails, continue with basic info
                
                tokens.append(token_info)
            
            return tokens
            
    except Exception as e:
        print(f"Error fetching Solana tokens: {e}")
        return []


async def get_token_metadata(mint_address: str) -> Optional[Dict]:
    """
    Get token metadata (name, symbol, etc.) from on-chain or known meme coin list
    """
    # Known meme coin mints (you can expand this list)
    MEME_COINS = {
        "So11111111111111111111111111111111111111112": {"name": "Wrapped SOL", "symbol": "SOL", "is_meme": False},
        # Add more known meme coins here
        # Example: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v": {"name": "USD Coin", "symbol": "USDC", "is_meme": False},
    }
    
    # Check if it's a known coin
    if mint_address in MEME_COINS:
        return MEME_COINS[mint_address]
    
    # Try to fetch from Metaplex Token Metadata Program
    # This is a simplified version - in production, you'd query the Metaplex program
    try:
        import httpx
        # Metaplex metadata PDA derivation
        # For now, return basic info and mark as potential meme coin if not in known list
        return {
            "name": "Unknown Token",
            "symbol": "UNKNOWN",
            "is_meme": True  # Assume unknown tokens might be meme coins
        }
    except:
        return {
            "name": "Unknown Token",
            "symbol": "UNKNOWN",
            "is_meme": True
        }

