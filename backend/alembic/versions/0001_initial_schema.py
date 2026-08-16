"""Initial schema: users, refresh_tokens, password_reset_tokens, altana_sessions

Revision ID: 0001
Revises:
Create Date: 2026-08-16 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("display_name", sa.String(100), nullable=True),
        sa.Column("wallet_address", sa.String(42), nullable=True),
        sa.Column("is_admin", sa.Boolean(), default=False, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"])

    op.create_table(
        "refresh_tokens",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("token_hash", sa.String(255), nullable=False, unique=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_refresh_tokens_user_id", "refresh_tokens", ["user_id"])

    op.create_table(
        "password_reset_tokens",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("token_hash", sa.String(255), nullable=False, unique=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used", sa.Boolean(), default=False, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_prt_user_id", "password_reset_tokens", ["user_id"])

    op.create_table(
        "altana_sessions",
        sa.Column("session_id", sa.String(66), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("user_address", sa.String(42), nullable=False),
        sa.Column("agent_id", sa.String(100), nullable=False),
        sa.Column("agent_name", sa.String(200), nullable=True),
        sa.Column("agent_contract", sa.String(42), nullable=True),
        sa.Column("spend_cap_bnb", sa.Float(), nullable=False),
        sa.Column("spent_amount_bnb", sa.Float(), default=0.0, nullable=False),
        sa.Column("created_at", sa.BigInteger(), nullable=False),
        sa.Column("expires_at", sa.BigInteger(), nullable=False),
        sa.Column("duration_hours", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(20), default="active", nullable=False),
        sa.Column("tx_hash", sa.String(66), nullable=True),
        sa.Column("revoked_at", sa.BigInteger(), nullable=True),
        sa.Column("revoke_tx_hash", sa.String(66), nullable=True),
        sa.Column("nonce", sa.Integer(), default=0, nullable=False),
        sa.Column("source", sa.String(20), default="local", nullable=False),
        sa.Column("activity_log", sa.JSON(), nullable=True),
    )
    op.create_index("ix_altana_sessions_user_address", "altana_sessions", ["user_address"])
    op.create_index("ix_altana_sessions_status", "altana_sessions", ["status"])
    op.create_index("ix_altana_sessions_user_id", "altana_sessions", ["user_id"])


def downgrade() -> None:
    op.drop_table("altana_sessions")
    op.drop_table("password_reset_tokens")
    op.drop_table("refresh_tokens")
    op.drop_table("users")
