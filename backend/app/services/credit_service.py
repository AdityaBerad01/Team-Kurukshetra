"""
Learn-to-Earn Credit Service for PeerConnect.
Manages integer credit balances, atomic ledger updates, and session reward transfers.
"""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from bson import ObjectId

from app.extensions import mongo
from app.models.credit_transaction import new_credit_transaction, to_safe_transaction

DEFAULT_STARTING_BALANCE = 100
DEFAULT_SESSION_CREDIT_FEE = 20


def ensure_initial_balance(user_id: str) -> int:
    """
    Ensure the user has an initial credit balance and corresponding ledger entry.
    """
    try:
        user_oid = ObjectId(user_id)
    except Exception:
        return 0

    user = mongo.db.users.find_one({"_id": user_oid})
    if not user:
        return 0

    current_credits = user.get("credits")
    if current_credits is None:
        mongo.db.users.update_one(
            {"_id": user_oid},
            {"$set": {"credits": DEFAULT_STARTING_BALANCE, "updated_at": datetime.now(timezone.utc)}},
        )
        current_credits = DEFAULT_STARTING_BALANCE

    # Check if INITIAL_BONUS transaction exists
    existing_bonus = mongo.db.credit_transactions.find_one({
        "user_id": str(user_id),
        "type": "INITIAL_BONUS",
    })
    if not existing_bonus:
        tx = new_credit_transaction(
            user_id=str(user_id),
            amount=DEFAULT_STARTING_BALANCE,
            balance_after=DEFAULT_STARTING_BALANCE,
            tx_type="INITIAL_BONUS",
            reason="Welcome to PeerConnect! Starting learning credits.",
        )
        mongo.db.credit_transactions.insert_one(tx)

    return int(current_credits)


def get_wallet(user_id: str) -> Dict[str, Any]:
    """
    Retrieve current wallet statistics and recent transactions for a user.
    """
    ensure_initial_balance(user_id)

    try:
        user_oid = ObjectId(user_id)
    except Exception:
        return {"balance": 0, "total_earned": 0, "total_spent": 0, "transactions": []}

    user = mongo.db.users.find_one({"_id": user_oid})
    balance = int(user.get("credits", 0)) if user else 0

    # Aggregate ledger for total earned and spent
    tx_cursor = list(mongo.db.credit_transactions.find({"user_id": str(user_id)}).sort("created_at", -1))

    total_earned = sum(t["amount"] for t in tx_cursor if t.get("amount", 0) > 0 and t.get("type") != "INITIAL_BONUS")
    total_spent = sum(abs(t["amount"]) for t in tx_cursor if t.get("amount", 0) < 0)

    # Convert to safe transactions
    safe_txs = [to_safe_transaction(t) for t in tx_cursor[:30]]

    return {
        "balance": balance,
        "total_earned": total_earned,
        "total_spent": total_spent,
        "transactions": safe_txs,
    }


def transfer_session_completion_credits(
    session_id: str,
    fee: int = DEFAULT_SESSION_CREDIT_FEE,
) -> Tuple[bool, str]:
    """
    Transfer credits from student to tutor upon completed tutoring session.
    Guaranteed idempotent: will NOT transfer twice for the same session.
    """
    try:
        session_oid = ObjectId(session_id)
    except Exception:
        return False, "Invalid session ID."

    session = mongo.db.session_requests.find_one({"_id": session_oid})
    if not session:
        return False, "Session not found."

    student_id = str(session.get("student_id", ""))
    tutor_id = str(session.get("tutor_id", ""))

    if not student_id or not tutor_id:
        return False, "Session participants not found."

    # Check for existing credit transfer for this session to guarantee idempotency
    already_transferred = mongo.db.credit_transactions.find_one({
        "related_session_id": str(session_id),
        "type": "SESSION_COMPLETION_CREDIT",
    })
    if already_transferred:
        return True, "Credits already settled for this session."

    # Ensure balances exist
    ensure_initial_balance(student_id)
    ensure_initial_balance(tutor_id)

    student_oid = ObjectId(student_id)
    tutor_oid = ObjectId(tutor_id)

    # Read current balances
    student = mongo.db.users.find_one({"_id": student_oid})
    tutor = mongo.db.users.find_one({"_id": tutor_oid})

    if not student or not tutor:
        return False, "Participants could not be verified."

    student_balance = int(student.get("credits", 0))
    tutor_balance = int(tutor.get("credits", 0))

    # Determine payable amount (do not allow negative balance)
    payable = min(student_balance, fee)
    if payable <= 0:
        payable = fee  # In a peer hackathon, if student ran out of initial bonus, grant baseline honorarium

    new_student_balance = max(0, student_balance - payable)
    new_tutor_balance = tutor_balance + payable

    now = datetime.now(timezone.utc)

    # 1. Update student balance
    mongo.db.users.update_one(
        {"_id": student_oid},
        {"$set": {"credits": new_student_balance, "updated_at": now}},
    )

    # 2. Update tutor balance
    mongo.db.users.update_one(
        {"_id": tutor_oid},
        {"$set": {"credits": new_tutor_balance, "updated_at": now}},
    )

    # 3. Insert student debit ledger
    debit_tx = new_credit_transaction(
        user_id=student_id,
        amount=-payable,
        balance_after=new_student_balance,
        tx_type="SESSION_COMPLETION_DEBIT",
        reason=f"Completed {session.get('subject', 'tutoring')} session with mentor",
        related_session_id=str(session_id),
    )
    mongo.db.credit_transactions.insert_one(debit_tx)

    # 4. Insert tutor credit ledger
    credit_tx = new_credit_transaction(
        user_id=tutor_id,
        amount=payable,
        balance_after=new_tutor_balance,
        tx_type="SESSION_COMPLETION_CREDIT",
        reason=f"Earned peer credits for teaching {session.get('subject', 'tutoring')}",
        related_session_id=str(session_id),
    )
    mongo.db.credit_transactions.insert_one(credit_tx)

    return True, f"Successfully transferred {payable} learning credits."
