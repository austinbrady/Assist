"""
Expert Scraper - Finds and learns from top 100 experts in any field
Searches forums, articles, interviews, and public content
Extracts standards, practices, and recommendations
"""

import re
import json
import logging
from typing import Dict, List, Optional
from datetime import datetime
from pathlib import Path
import httpx
from expert_knowledge import get_expert_system

logger = logging.getLogger(__name__)

class ExpertScraper:
    """Scrapes and extracts knowledge from top experts"""
    
    def __init__(self):
        self.expert_system = get_expert_system()
        # Common forums and sources to search
        self.sources = {
            'forums': [
                'gearspace.com',
                'reddit.com/r/audioengineering',
                'reddit.com/r/WeAreTheMusicMakers',
                'reddit.com/r/videoediting',
                'reddit.com/r/Filmmakers',
                'vi-control.net',
                'kvraudio.com',
            ],
            'articles': [
                'soundonsound.com',
                'mixingmastering.com',
                'producerhive.com',
                'noisegate.com.au',
            ],
            'youtube': [
                'youtube.com',
            ]
        }
    
    async def find_experts_by_field(self, field: str, limit: int = 100) -> List[Dict]:
        """
        Find top experts in a field
        Uses multiple search strategies to identify the most successful professionals
        """
        logger.info(f"Finding top {limit} experts in {field}")
        
        experts = []
        seen_names = set()
        
        # Import web_search from main
        try:
            import sys
            import os
            # Get the parent directory to import from main
            backend_dir = Path(__file__).parent
            sys.path.insert(0, str(backend_dir))
            from main import web_search
        except ImportError:
            logger.warning("Could not import web_search, using fallback")
            web_search = None
        
        # Strategy 1: Search for "top [field]" lists
        search_queries = [
            f"top 100 {field} professionals",
            f"best {field} in the industry",
            f"most successful {field}",
            f"{field} hall of fame",
            f"award winning {field}",
            f"famous {field} list",
            f"{field} experts",
        ]
        
        for query in search_queries[:5]:  # Limit queries
            try:
                if web_search:
                    results = await web_search(query, max_results=10)
                    for result in results:
                        # Extract expert names from search results
                        # This is a simplified extraction - in production, use NLP
                        text = f"{result.get('title', '')} {result.get('snippet', '')}"
                        # Look for patterns like "Joey Sturgis", "producer name", etc.
                        # For now, we'll store the search results and extract later
                        if result.get('url') and result.get('title'):
                            expert_candidate = {
                                'name': result.get('title', '').split(' - ')[0].split(' | ')[0],
                                'source': result.get('url', ''),
                                'description': result.get('snippet', ''),
                                'field': field,
                                'found_via': query
                            }
                            # Simple deduplication
                            name_key = expert_candidate['name'].lower()
                            if name_key not in seen_names and len(expert_candidate['name']) > 3:
                                seen_names.add(name_key)
                                experts.append(expert_candidate)
                else:
                    # Fallback: create placeholder structure
                    pass
            except Exception as e:
                logger.warning(f"Error searching for experts with query '{query}': {e}")
        
        # Limit to top N
        return experts[:limit]
    
    async def extract_expert_standards(self, expert_name: str, field: str) -> Dict:
        """
        Extract standards and practices from an expert's public content
        Searches: interviews, tutorials, forum posts, articles, social media
        """
        logger.info(f"Extracting standards from {expert_name} ({field})")
        
        standards = {
            'expert_name': expert_name,
            'field': field,
            'extracted_at': datetime.now().isoformat(),
            'rms_recommendations': {},
            'lufs_recommendations': {},
            'frequency_guidelines': {},
            'workflow_practices': [],
            'equipment_preferences': {},
            'genre_specific_advice': {},
            'quotes': [],
            'sources': []
        }
        
        # Search for expert's content
        search_queries = [
            f"{expert_name} mixing tips",
            f"{expert_name} mastering advice",
            f"{expert_name} interview",
            f"{expert_name} tutorial",
            f"{expert_name} forum post",
            f"{expert_name} {field} standards",
        ]
        
        # This would:
        # 1. Search web for expert's content
        # 2. Extract relevant information using NLP
        # 3. Parse technical specifications (RMS, LUFS, etc.)
        # 4. Extract quotes and recommendations
        # 5. Store in expert knowledge system
        
        return standards
    
    async def aggregate_field_standards(self, field: str, subfield: Optional[str] = None) -> Dict:
        """
        Aggregate standards from top 100 experts in a field
        Creates consensus-based recommendations
        """
        logger.info(f"Aggregating standards for {field}" + (f" / {subfield}" if subfield else ""))
        
        # Find top experts
        experts = await self.find_experts_by_field(f"{subfield} {field}" if subfield else field, limit=100)
        
        # Extract standards from each expert
        all_standards = []
        for expert in experts:
            try:
                standards = await self.extract_expert_standards(expert['name'], field)
                all_standards.append(standards)
            except Exception as e:
                logger.warning(f"Error extracting standards from {expert.get('name', 'unknown')}: {e}")
        
        # Aggregate into consensus
        aggregated = self._aggregate_standards(all_standards, field, subfield)
        
        # Store in expert knowledge system
        await self.expert_system.get_field_standards(field, subfield)
        
        return aggregated
    
    def _aggregate_standards(self, standards_list: List[Dict], field: str, subfield: Optional[str]) -> Dict:
        """Aggregate multiple expert standards into consensus recommendations"""
        
        aggregated = {
            'field': field,
            'subfield': subfield,
            'expert_count': len(standards_list),
            'aggregated_at': datetime.now().isoformat(),
            'rms_consensus': {},
            'lufs_consensus': {},
            'frequency_consensus': {},
            'common_practices': [],
            'expert_quotes': []
        }
        
        # Aggregate RMS recommendations by genre
        rms_by_genre = {}
        for standards in standards_list:
            rms_recs = standards.get('rms_recommendations', {})
            for genre, values in rms_recs.items():
                if genre not in rms_by_genre:
                    rms_by_genre[genre] = []
                rms_by_genre[genre].extend([values] if isinstance(values, (int, float)) else values)
        
        # Calculate consensus (median/mean of expert recommendations)
        for genre, values in rms_by_genre.items():
            if values:
                aggregated['rms_consensus'][genre] = {
                    'min': min(values),
                    'max': max(values),
                    'optimal': sum(values) / len(values),  # Mean
                    'median': sorted(values)[len(values) // 2],
                    'expert_count': len(values)
                }
        
        # Similar aggregation for LUFS, frequency guidelines, etc.
        
        return aggregated
    
    async def search_expert_advice(self, field: str, question: str) -> List[Dict]:
        """
        Search for expert advice on a specific question
        Returns relevant quotes and recommendations from top experts
        """
        logger.info(f"Searching expert advice: {field} - {question}")
        
        # Import web_search
        try:
            import sys
            backend_dir = Path(__file__).parent
            sys.path.insert(0, str(backend_dir))
            from main import web_search
        except ImportError:
            logger.warning("Could not import web_search")
            return []
        
        # Build search queries targeting expert sources
        search_queries = [
            f"{question} {field} expert advice",
            f"top {field} {question}",
            f"{question} best practices {field}",
            f"{question} {field} forum",
            f"{question} {field} interview",
        ]
        
        results = []
        seen_urls = set()
        
        for query in search_queries:
            try:
                search_results = await web_search(query, max_results=5)
                for result in search_results:
                    url = result.get('url', '')
                    if url and url not in seen_urls:
                        seen_urls.add(url)
                        # Check if source is from expert forums/sites
                        url_lower = url.lower()
                        is_expert_source = any(source in url_lower for source in [
                            'gearspace', 'soundonsound', 'reddit.com/r/audioengineering',
                            'producerhive', 'mixingmastering', 'youtube.com'
                        ])
                        
                        if is_expert_source or 'expert' in result.get('title', '').lower():
                            results.append({
                                'expert': self._extract_expert_name(result),
                                'quote': result.get('snippet', ''),
                                'source': url,
                                'title': result.get('title', ''),
                                'field': field,
                                'question': question
                            })
            except Exception as e:
                logger.warning(f"Error searching expert advice for '{query}': {e}")
        
        return results[:10]  # Return top 10 results
    
    def _extract_expert_name(self, result: Dict) -> str:
        """Extract expert name from search result"""
        title = result.get('title', '')
        snippet = result.get('snippet', '')
        
        # Try to extract name from title (e.g., "Joey Sturgis on mixing...")
        # This is simplified - in production, use NLP
        words = title.split()
        if len(words) > 0:
            # Assume first 2-3 words might be a name
            potential_name = ' '.join(words[:2])
            if len(potential_name) > 3 and potential_name[0].isupper():
                return potential_name
        
        return "Industry expert"


# Global instance
_expert_scraper: Optional[ExpertScraper] = None

def get_expert_scraper() -> ExpertScraper:
    """Get or create the global expert scraper"""
    global _expert_scraper
    if _expert_scraper is None:
        _expert_scraper = ExpertScraper()
    return _expert_scraper

