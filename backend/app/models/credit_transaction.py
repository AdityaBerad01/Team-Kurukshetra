"""
Credit transaction model and serialization helpers for PeerConnect Learn-to-Earn system.
Provides an immutable double-entry style audit ledger for all credit transfers.
"""
from datetime import datetime, timezone
import uuid
from typing import Any, Dict, Optional

VALID_TRANSACTION_TYPES = {
    "INITIAL_BONUS",
    "SESSION_COMPLETION_DEBIT",
    "SESSION_COMPLETION_CREDIT",
    "SESSION_RESERVATION",
    "SESSION_REFUND",
    "MANUAL_ADJUSTMENT",
}


def new_credit_transaction(
    user_id: str,
    amount: int,
    balance_after: int,
    tx_type: str,
    reason: str,
    related_session_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Build a credit transaction ledger entry.
    """
    now = datetime.now(timezone.utc)
    tx_id = f"tx_{uuid.uuid4().hex[:12]}"

    return {
        "transaction_id": tx_id,
        "user_id": str(user_id),
        "amount": int(amount),
        "balance_after": max(0, int(balance_after)),
        "type": tx_type.strip().upper(),
        "reason": reason.strip(),
        "related_session_id": str(related_session_id) if related_session_id else None,
        "created_at": now,
    }


def to_safe_transaction(tx_doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """
    Serialize a credit transaction document for client responses.
    """
    if not tx_doc:
        return None

    created_at = tx_doc.get("created_at")
    created_str = created_at.isoformat() if isinstance(created_at, datetime) else str(created_at or "")

    return {
        "id": str(tx_doc.get("_id", tx_doc.get("transaction_id", ""))),
        "transaction_id": tx_doc.get("transaction_id", ""),
        "user_id": str(tx_doc.get("user_id", "")),
        "amount": int(tx_doc.get("amount", 0)),
        "balance_after": int(tx_doc.get("balance_after", 0)),
        "type": tx_doc.get("type", "INITIAL_BONUS"),
        "reason": tx_doc.get("reason", ""),
        "related_session_id": tx_doc.get("related_session_id"),
        "created_at": created_str,
    }
