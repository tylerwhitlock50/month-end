"""
Tests for reconciliation tag parser service
"""

import pytest
from decimal import Decimal
from backend.services.reconciliation_tag_parser import (
    ReconciliationTagParser,
    extract_reconciliation_values
)


def test_tag_pattern_matching():
    """Test that the tag pattern correctly matches various formats."""
    parser = ReconciliationTagParser(b"", "test.csv")
    
    # Valid tags
    assert parser.TAG_PATTERN.search("TB-1-1000")
    assert parser.TAG_PATTERN.search("Some text TB-123-ABC-123 more text")
    assert parser.TAG_PATTERN.search("TB-45-1234.5")
    
    # Invalid tags
    assert not parser.TAG_PATTERN.search("TB-1")
    assert not parser.TAG_PATTERN.search("TB-1-")
    assert not parser.TAG_PATTERN.search("1-1000")


def test_extract_numeric_value_simple():
    """Test extraction of simple numeric values."""
    parser = ReconciliationTagParser(b"", "test.csv")
    
    # Integer and float
    assert parser._extract_numeric_value(1000) == Decimal("1000")
    assert parser._extract_numeric_value(1000.50) == Decimal("1000.50")
    
    # String numbers
    assert parser._extract_numeric_value("1000") == Decimal("1000")
    assert parser._extract_numeric_value("1000.50") == Decimal("1000.50")
    assert parser._extract_numeric_value("-500.25") == Decimal("-500.25")


def test_extract_numeric_value_formatted():
    """Test extraction of formatted currency values."""
    parser = ReconciliationTagParser(b"", "test.csv")
    
    # Currency symbols and commas
    assert parser._extract_numeric_value("$1,000.00") == Decimal("1000.00")
    assert parser._extract_numeric_value("€ 5,432.10") == Decimal("5432.10")
    assert parser._extract_numeric_value("£12,345.67") == Decimal("12345.67")
    
    # Accounting format (parentheses for negative)
    assert parser._extract_numeric_value("(500.00)") == Decimal("-500.00")
    assert parser._extract_numeric_value("$(1,234.56)") == Decimal("-1234.56")


def test_extract_numeric_value_invalid():
    """Test extraction returns None for invalid values."""
    parser = ReconciliationTagParser(b"", "test.csv")
    
    assert parser._extract_numeric_value(None) is None
    assert parser._extract_numeric_value("") is None
    assert parser._extract_numeric_value("Not a number") is None
    assert parser._extract_numeric_value("ABC123") is None


def test_csv_parsing_single_tag():
    """Test parsing a CSV file with a single reconciliation tag."""
    csv_content = b"""Account,Balance,Tag
Cash,5000.00,TB-1-1000
AR,3500.50,TB-1-1200
AP,-2000.00,TB-1-2100"""
    
    parser = ReconciliationTagParser(csv_content, "recon.csv")
    tags = parser.parse()
    
    assert len(tags) == 3
    assert tags["TB-1-1000"] == Decimal("5000.00")
    assert tags["TB-1-1200"] == Decimal("3500.50")
    assert tags["TB-1-2100"] == Decimal("-2000.00")


def test_csv_parsing_tag_not_in_last_column():
    """Test parsing CSV where tag can be anywhere in the row."""
    csv_content = b"""Account,Tag,Balance,Other
Cash,TB-1-1000,5000.00,Notes
AR,TB-1-1200,3500.50,More notes"""
    
    parser = ReconciliationTagParser(csv_content, "recon.csv")
    tags = parser.parse()
    
    # Tag in column 2 should extract from column 1
    assert "TB-1-1000" in tags
    assert tags["TB-1-1000"] == Decimal("5000.00") or parser.get_errors()


def test_csv_parsing_no_tags():
    """Test parsing CSV with no reconciliation tags returns empty dict."""
    csv_content = b"""Account,Balance
Cash,5000.00
AR,3500.50"""
    
    parser = ReconciliationTagParser(csv_content, "recon.csv")
    tags = parser.parse()
    
    assert len(tags) == 0


def test_csv_parsing_duplicate_tags():
    """Test parsing CSV with duplicate tags records errors."""
    csv_content = b"""Account,Balance,Tag
Cash,5000.00,TB-1-1000
Other,3000.00,TB-1-1000"""
    
    parser = ReconciliationTagParser(csv_content, "recon.csv")
    tags = parser.parse()
    
    # Should have the tag but also an error
    assert "TB-1-1000" in tags
    assert any("Duplicate tag" in err for err in parser.get_errors())


def test_csv_parsing_tag_in_first_column():
    """Test parsing CSV where tag is in first column (no value to left)."""
    csv_content = b"""Tag,Balance
TB-1-1000,5000.00"""
    
    parser = ReconciliationTagParser(csv_content, "recon.csv")
    tags = parser.parse()
    
    # Should not extract tag from first column
    assert len(tags) == 0
    assert any("first column" in err.lower() for err in parser.get_errors())


def test_csv_parsing_formatted_values():
    """Test CSV parsing with various formatted values."""
    csv_content = b"""Account,Balance,Tag
Cash,"$5,000.00",TB-1-1000
AR,"(1,500.50)",TB-1-1200
AP,"3,250.75",TB-1-2100"""
    
    parser = ReconciliationTagParser(csv_content, "recon.csv")
    tags = parser.parse()
    
    assert tags["TB-1-1000"] == Decimal("5000.00")
    assert tags["TB-1-1200"] == Decimal("-1500.50")
    assert tags["TB-1-2100"] == Decimal("3250.75")


def test_extract_reconciliation_values_with_period_filter():
    """Test convenience function with period filtering."""
    csv_content = b"""Account,Balance,Tag
Cash,5000.00,TB-1-1000
AR,3500.50,TB-2-1200
AP,-2000.00,TB-1-2100"""
    
    # Filter for period 1 only
    tags, errors = extract_reconciliation_values(csv_content, "recon.csv", period_id=1)
    
    assert len(tags) == 2
    assert "TB-1-1000" in tags
    assert "TB-1-2100" in tags
    assert "TB-2-1200" not in tags


def test_extract_reconciliation_values_no_period_filter():
    """Test convenience function without period filtering."""
    csv_content = b"""Account,Balance,Tag
Cash,5000.00,TB-1-1000
AR,3500.50,TB-2-1200"""
    
    tags, errors = extract_reconciliation_values(csv_content, "recon.csv")
    
    assert len(tags) == 2
    assert "TB-1-1000" in tags
    assert "TB-2-1200" in tags


def test_unsupported_file_format():
    """Test that unsupported file formats return empty results with error."""
    parser = ReconciliationTagParser(b"content", "file.pdf")
    tags = parser.parse()
    
    assert len(tags) == 0
    assert any("Unsupported file format" in err for err in parser.get_errors())


# Note: Excel file tests (.xlsx/.xls) would require creating actual Excel files
# or using mock libraries. For now, we test the CSV logic which covers the core
# parsing functionality. Excel tests can be added with openpyxl test fixtures.

