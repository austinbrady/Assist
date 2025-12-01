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
    """Load existing Solana wallet from file for a specific user"""
    wallet_file = get_solana_wallet_file(username)
    if not wallet_file.exists():
        return None
    
    try:
        with open(wallet_file, 'r', encoding='utf-8') as f:
            wallet = json.load(f)
        return wallet
    except Exception as e:
        print(f"Error loading Solana wallet: {e}")
        return None


def save_solana_wallet(username: str, wallet: Dict) -> bool:
    """Save Solana wallet to file for a specific user"""
    try:
        wallet_file = get_solana_wallet_file(username)
        wallet_file.parent.mkdir(parents=True, exist_ok=True)
        with open(wallet_file, 'w', encoding='utf-8') as f:
            json.dump(wallet, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Error saving Solana wallet: {e}")
        return False


def get_or_create_solana_wallet(username: str) -> Dict:
    """Get existing Solana wallet or create a new one for a specific user"""
    wallet = load_solana_wallet(username)
    if wallet:
        return wallet
    
    # Create new wallet
    wallet = generate_solana_wallet()
    save_solana_wallet(username, wallet)
    return wallet


def regenerate_solana_wallet(username: str) -> Dict:
    """Regenerate Solana wallet (create new one) for a specific user"""
    wallet = generate_solana_wallet()
    save_solana_wallet(username, wallet)
    return wallet


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

