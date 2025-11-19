"""
Tests for reconciliation tag endpoints and validation auto-extraction
"""

import pytest
import io
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from backend.models import (
    TrialBalance as TrialBalanceModel,
    TrialBalanceAccount as TrialBalanceAccountModel,
    Period as PeriodModel,
    User as UserModel,
)


def test_get_account_reconciliation_tag(client: TestClient, db_session: Session):
    """Test getting reconciliation tag for an account."""
    # Create test data
    period = PeriodModel(
        name="Test Period",
        start_date="2024-01-01",
        end_date="2024-01-31",
        close_type="monthly",
        status="in_progress"
    )
    db_session.add(period)
    db_session.flush()
    
    tb = TrialBalanceModel(
        period_id=period.id,
        name="Test TB",
        source_filename="test.csv",
        stored_filename="test.csv",
        file_path="/test/test.csv"
    )
    db_session.add(tb)
    db_session.flush()
    
    account = TrialBalanceAccountModel(
        trial_balance_id=tb.id,
        account_number="1000",
        account_name="Cash",
        reconciliation_tag=f"TB-{period.id}-1000",
        ending_balance=5000.00
    )
    db_session.add(account)
    db_session.commit()
    
    # Get tag
    response = client.get(f"/api/trial-balance/accounts/{account.id}/tag")
    assert response.status_code == 200
    
    data = response.json()
    assert data["account_id"] == account.id
    assert data["account_number"] == "1000"
    assert data["reconciliation_tag"] == f"TB-{period.id}-1000"
    assert "instructions" in data


def test_get_account_tag_not_found(client: TestClient):
    """Test getting tag for non-existent account returns 404."""
    response = client.get("/api/trial-balance/accounts/99999/tag")
    assert response.status_code == 404


def test_validation_auto_extraction_csv(client: TestClient, db_session: Session):
    """Test automatic value extraction from CSV file during validation."""
    # Create test data
    period = PeriodModel(
        name="Test Period",
        start_date="2024-01-01",
        end_date="2024-01-31",
        close_type="monthly",
        status="in_progress"
    )
    db_session.add(period)
    db_session.flush()
    
    tb = TrialBalanceModel(
        period_id=period.id,
        name="Test TB",
        source_filename="test.csv",
        stored_filename="test.csv",
        file_path="/test/test.csv"
    )
    db_session.add(tb)
    db_session.flush()
    
    tag = f"TB-{period.id}-1000"
    account = TrialBalanceAccountModel(
        trial_balance_id=tb.id,
        account_number="1000",
        account_name="Cash",
        reconciliation_tag=tag,
        ending_balance=5000.00
    )
    db_session.add(account)
    db_session.commit()
    
    # Create CSV with reconciliation tag
    csv_content = f"""Account,Balance,Tag
Cash,5000.00,{tag}"""
    
    # Upload validation with CSV file
    files = {"file": ("recon.csv", io.BytesIO(csv_content.encode()), "text/csv")}
    data = {}  # No supporting_amount - should be auto-extracted
    
    response = client.post(
        f"/api/trial-balance/accounts/{account.id}/validations",
        data=data,
        files=files
    )
    
    assert response.status_code == 201
    result = response.json()
    
    # Check auto-extraction metadata
    assert result["auto_extracted"] is True
    assert result["reconciliation_tag"] == tag
    
    # Check validation was created with correct amount
    validation = result["validation"]
    assert validation["supporting_amount"] == 5000.00
    assert validation["matches_balance"] is True


def test_validation_manual_override_auto_extraction(client: TestClient, db_session: Session):
    """Test that manual amount overrides auto-extraction."""
    # Create test data
    period = PeriodModel(
        name="Test Period",
        start_date="2024-01-01",
        end_date="2024-01-31",
        close_type="monthly",
        status="in_progress"
    )
    db_session.add(period)
    db_session.flush()
    
    tb = TrialBalanceModel(
        period_id=period.id,
        name="Test TB",
        source_filename="test.csv",
        stored_filename="test.csv",
        file_path="/test/test.csv"
    )
    db_session.add(tb)
    db_session.flush()
    
    tag = f"TB-{period.id}-1000"
    account = TrialBalanceAccountModel(
        trial_balance_id=tb.id,
        account_number="1000",
        account_name="Cash",
        reconciliation_tag=tag,
        ending_balance=5000.00
    )
    db_session.add(account)
    db_session.commit()
    
    # Create CSV with reconciliation tag
    csv_content = f"""Account,Balance,Tag
Cash,5000.00,{tag}"""
    
    # Upload with manual amount (should override)
    files = {"file": ("recon.csv", io.BytesIO(csv_content.encode()), "text/csv")}
    data = {"supporting_amount": "4500.00"}  # Manual override
    
    response = client.post(
        f"/api/trial-balance/accounts/{account.id}/validations",
        data=data,
        files=files
    )
    
    assert response.status_code == 201
    result = response.json()
    
    # Should not be auto-extracted since manual value provided
    assert result["auto_extracted"] is False
    
    # Should use manual amount
    validation = result["validation"]
    assert validation["supporting_amount"] == 4500.00


def test_validation_without_file_or_amount_fails(client: TestClient, db_session: Session):
    """Test that validation without file or amount fails."""
    # Create test data
    period = PeriodModel(
        name="Test Period",
        start_date="2024-01-01",
        end_date="2024-01-31",
        close_type="monthly",
        status="in_progress"
    )
    db_session.add(period)
    db_session.flush()
    
    tb = TrialBalanceModel(
        period_id=period.id,
        name="Test TB",
        source_filename="test.csv",
        stored_filename="test.csv",
        file_path="/test/test.csv"
    )
    db_session.add(tb)
    db_session.flush()
    
    account = TrialBalanceAccountModel(
        trial_balance_id=tb.id,
        account_number="1000",
        account_name="Cash",
        reconciliation_tag=f"TB-{period.id}-1000",
        ending_balance=5000.00
    )
    db_session.add(account)
    db_session.commit()
    
    # Try to create validation without file or amount
    response = client.post(
        f"/api/trial-balance/accounts/{account.id}/validations",
        data={}
    )
    
    assert response.status_code == 400
    assert "required" in response.json()["detail"].lower()


def test_bulk_validations_multiple_tags(client: TestClient, db_session: Session):
    """Test bulk validation creation from file with multiple tags."""
    # Create test data
    period = PeriodModel(
        name="Test Period",
        start_date="2024-01-01",
        end_date="2024-01-31",
        close_type="monthly",
        status="in_progress"
    )
    db_session.add(period)
    db_session.flush()
    
    tb = TrialBalanceModel(
        period_id=period.id,
        name="Test TB",
        source_filename="test.csv",
        stored_filename="test.csv",
        file_path="/test/test.csv"
    )
    db_session.add(tb)
    db_session.flush()
    
    # Create multiple accounts
    accounts = []
    for i, (number, name, balance) in enumerate([
        ("1000", "Cash", 5000.00),
        ("1200", "AR", 3500.50),
        ("2100", "AP", -2000.00),
    ]):
        account = TrialBalanceAccountModel(
            trial_balance_id=tb.id,
            account_number=number,
            account_name=name,
            reconciliation_tag=f"TB-{period.id}-{number}",
            ending_balance=balance
        )
        db_session.add(account)
        accounts.append(account)
    
    db_session.commit()
    
    # Create CSV with multiple tags
    csv_content = f"""Account,Balance,Tag
Cash,5000.00,TB-{period.id}-1000
AR,3500.50,TB-{period.id}-1200
AP,-2000.00,TB-{period.id}-2100"""
    
    # Upload bulk validation
    files = {"file": ("bulk_recon.csv", io.BytesIO(csv_content.encode()), "text/csv")}
    data = {"period_id": str(period.id)}
    
    response = client.post(
        "/api/trial-balance/validations/bulk",
        data=data,
        files=files
    )
    
    assert response.status_code == 201
    result = response.json()
    
    assert result["created_count"] == 3
    assert result["total_tags_found"] == 3
    assert len(result["validations"]) == 3
    assert len(result["tags_not_found"]) == 0
    
    # Verify all validations created correctly
    for validation in result["validations"]:
        assert validation["matches"] is True


def test_bulk_validations_period_filter(client: TestClient, db_session: Session):
    """Test bulk validation only creates for accounts in specified period."""
    # Create two periods
    period1 = PeriodModel(
        name="Period 1",
        start_date="2024-01-01",
        end_date="2024-01-31",
        close_type="monthly",
        status="in_progress"
    )
    period2 = PeriodModel(
        name="Period 2",
        start_date="2024-02-01",
        end_date="2024-02-29",
        close_type="monthly",
        status="in_progress"
    )
    db_session.add_all([period1, period2])
    db_session.flush()
    
    # Create TB for period 1
    tb1 = TrialBalanceModel(
        period_id=period1.id,
        name="TB Period 1",
        source_filename="test.csv",
        stored_filename="test.csv",
        file_path="/test/test.csv"
    )
    db_session.add(tb1)
    db_session.flush()
    
    # Create account in period 1
    account1 = TrialBalanceAccountModel(
        trial_balance_id=tb1.id,
        account_number="1000",
        account_name="Cash",
        reconciliation_tag=f"TB-{period1.id}-1000",
        ending_balance=5000.00
    )
    db_session.add(account1)
    db_session.commit()
    
    # Create CSV with tags from both periods
    csv_content = f"""Account,Balance,Tag
Cash P1,5000.00,TB-{period1.id}-1000
Cash P2,6000.00,TB-{period2.id}-1000"""
    
    # Upload bulk validation for period 1 only
    files = {"file": ("bulk_recon.csv", io.BytesIO(csv_content.encode()), "text/csv")}
    data = {"period_id": str(period1.id)}
    
    response = client.post(
        "/api/trial-balance/validations/bulk",
        data=data,
        files=files
    )
    
    assert response.status_code == 201
    result = response.json()
    
    # Should only create validation for period 1
    assert result["created_count"] == 1
    assert result["total_tags_found"] == 1
    assert len(result["validations"]) == 1
    
    # Period 2 tag should be in tags_not_found (filtered out by period)
    # Actually, it should not appear at all since we filter by period_id
    assert f"TB-{period2.id}-1000" not in [v["tag"] for v in result["validations"]]

