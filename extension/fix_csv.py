#!/usr/bin/env python3
"""
Script to fix and restructure the Vetted Candidates CSV file.
Extracts and properly formats company, university, and field of study data.
"""

import csv
import re
from datetime import datetime
from collections import OrderedDict

def extract_company_name(text):
    """Extract company name from text that may contain dates and tenure."""
    if not text or text.strip() == '':
        return ''
    
    original_text = text
    
    # Remove duplicate date/tenure patterns (e.g., "Aug 2025 - Present · 5 mosAug 2025 to Present · 5 mos")
    # First, remove the duplicate part
    text = re.sub(r'([A-Z][a-z]{2}\s+\d{4}\s+-\s+(?:Present|[A-Z][a-z]{2}\s+\d{4})\s+·\s+\d+\s+(?:mos|yrs))[A-Z][a-z]{2}\s+\d{4}\s+to\s+(?:Present|\d{4})\s+·\s+\d+\s+(?:mos|yrs)', r'\1', text)
    
    # Remove date patterns like "Aug 2025 - Present · 5 mos"
    text = re.sub(r'[A-Z][a-z]{2}\s+\d{4}\s+-\s+(?:Present|[A-Z][a-z]{2}\s+\d{4})\s+·\s+\d+\s+(?:mos|yrs)', '', text)
    text = re.sub(r'\d{4}\s+to\s+(?:Present|\d{4})\s+·\s+\d+\s+(?:mos|yrs)', '', text)
    
    # Remove standalone date ranges
    text = re.sub(r'\d{4}\s+-\s+\d{4}\s+·\s+\d+\s+(?:yrs|mos)\s+\d+\s+(?:mos|yrs)', '', text)
    text = re.sub(r'\d{4}\s+to\s+\d{4}', '', text)
    
    # Remove tenure patterns
    text = re.sub(r'·\s+\d+\s+(?:mos|yrs)', '', text)
    text = re.sub(r'\d+\s+(?:yrs|mos)', '', text)
    
    # Remove year-only patterns
    text = re.sub(r'^\d{4}\s+-\s+(?:Present|\d{4})$', '', text)
    text = re.sub(r'^\d{4}\s+to\s+(?:Present|\d{4})$', '', text)
    
    # Remove month-only patterns that might be left (like "Aug")
    text = re.sub(r'^[A-Z][a-z]{2}$', '', text)
    
    # Clean up extra spaces and separators
    text = re.sub(r'\s+', ' ', text)
    text = text.strip()
    
    # If after cleaning we have nothing or just a month name, return empty
    if not text or len(text) < 3 or text in ['Aug', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Sep', 'Oct', 'Nov', 'Dec']:
        return ''
    
    return text

def extract_tenure_years_months(text):
    """Extract years and months from tenure text."""
    if not text:
        return None, None
    
    years = None
    months = None
    
    # Pattern: "5 yrs 5 mos" or "5 yrs" or "5 mos"
    year_match = re.search(r'(\d+)\s+yrs?', text)
    month_match = re.search(r'(\d+)\s+mos?', text)
    
    if year_match:
        years = int(year_match.group(1))
    if month_match:
        months = int(month_match.group(1))
    
    return years, months

def extract_date_range(text):
    """Extract start and end dates from text."""
    if not text:
        return None, None
    
    start_date = None
    end_date = None
    
    # Pattern 1: "Aug 2025 - Present" or "Aug 2025 - Jul 2025"
    date_pattern1 = r'([A-Z][a-z]{2})\s+(\d{4})\s+-\s+(?:Present|([A-Z][a-z]{2})\s+(\d{4}))'
    match = re.search(date_pattern1, text)
    
    if match:
        start_month = match.group(1)
        start_year = int(match.group(2))
        if match.group(3):  # End date exists
            end_month = match.group(3)
            end_year = int(match.group(4))
            end_date = f"{end_month} {end_year}"
        else:  # Present
            end_date = "Present"
        start_date = f"{start_month} {start_year}"
    else:
        # Pattern 2: "2020 - Present" or "2020 - 2018" (year only)
        date_pattern2 = r'(\d{4})\s+-\s+(?:Present|(\d{4}))'
        match2 = re.search(date_pattern2, text)
        if match2:
            start_year = match2.group(1)
            if match2.group(2):  # End year exists
                end_date = match2.group(2)
            else:  # Present
                end_date = "Present"
            start_date = start_year
    
    return start_date, end_date

def parse_companies_from_titles(titles_text):
    """Extract company names from Previous title(s) field."""
    if not titles_text:
        return []
    
    companies = []
    # Split by semicolon
    parts = titles_text.split(';')
    
    # Common job title patterns to skip
    job_title_patterns = [
        r'^(Director|Manager|Senior|Lead|Co-Founder|Founder|Head of|VP|Vice President|Software Engineer|Member|Investor|Board Member|Associate|Junior|Technical|Product|Engineering|Recruiting|Recruiter|Marketing|Consultant|Analyst|Researcher|Developer|Executive|Chief)',
        r'^Making\s+',  # "Making wealth-building accessible..."
        r'^Helped\s+',   # "Helped health systems..."
        r'^Working\s+on',  # "Working on building..."
        r'^Joined\s+',   # "Joined early..."
        r'^Employee#',   # "Employee# 5..."
        r'^Designed\s+', # "Designed and Implemented..."
        r'^Developed\s+', # "Developed features..."
        r'^Created\s+',  # "Created Contextual..."
        r'^•\s+',        # Bullet points
        r'^Increased\s+', # "Increased conversion..."
        r'^Launched\s+', # "Launched new..."
        r'^Aligned\s+',  # "Aligned cross-functional..."
        r'^Markedly\s+', # "Markedly reduced..."
        r'^Directly\s+', # "Directly increased..."
        r'^Enabled\s+', # "Enabled new perspectives..."
        r'^Investing\s+in', # "Investing in founders..."
        r'^NASDAQ:',     # "NASDAQ: COIN"
    ]
    
    for part in parts:
        part = part.strip()
        if not part or len(part) < 3:
            continue
        
        # Skip if it's a job title or description
        is_job_title = False
        for pattern in job_title_patterns:
            if re.match(pattern, part, re.IGNORECASE):
                is_job_title = True
                break
        
        if is_job_title:
            continue
        
        # Look for company indicators
        # Companies often appear after job titles, or standalone
        # Examples: "Dave", "UiPath", "NEXT Trucking", "YouTube", "Salesforce", "Heroku", "Veeva Systems", etc.
        
        # Check if it contains company indicators
        has_company_indicators = (
            'backed by' in part.lower() or
            'Series' in part or
            'IPO' in part or
            'NASDAQ:' in part or
            re.search(r'\b(YC|Series [A-Z]|IPO|NASDAQ)', part)
        )
        
        # Check if it's a job title (more comprehensive check)
        job_title_keywords = [
            'engineer', 'manager', 'director', 'recruiter', 'recruiting', 'developer',
            'analyst', 'researcher', 'consultant', 'founder', 'co-founder', 'ceo', 'cto',
            'product manager', 'marketing', 'communications', 'administrative', 'assistant',
            'intern', 'fellow', 'member', 'board', 'investor', 'executive', 'chief',
            'vice president', 'vp', 'head of', 'head ', 'lead', 'senior', 'junior', 'associate',
            'ta', 'recruiting', 'recruiter'
        ]
        is_job_title_keyword = any(keyword in part.lower() for keyword in job_title_keywords)
        
        # If it's short and doesn't look like a description, it might be a company
        is_likely_company = (
            len(part) < 100 and  # Not a long description
            not part.startswith('(') and  # Not a parenthetical note
            not '•' in part and  # Not a bullet point
            not is_job_title_keyword and  # Not a job title
            (has_company_indicators or 
             (len(part.split()) <= 5 and part[0].isupper() and not is_job_title_keyword))  # Short capitalized phrase that's not a job title
        )
        
        if is_likely_company:
            # Clean up the company name
            # Remove parenthetical notes like "(YC S20)"
            cleaned = re.sub(r'\([^)]+\)', '', part)
            # Remove "backed by X" patterns
            cleaned = re.sub(r'backed by [^;]+', '', cleaned, flags=re.IGNORECASE)
            # Remove "Series X" patterns
            cleaned = re.sub(r'Series [A-Z]\d*', '', cleaned)
            # Remove "> IPO" patterns
            cleaned = re.sub(r'>\s*IPO[^;]*', '', cleaned)
            cleaned = cleaned.strip()
            
            # Final check - make sure it's not a job title after cleaning
            cleaned_lower = cleaned.lower()
            is_still_job_title = any(keyword in cleaned_lower for keyword in job_title_keywords)
            
            if cleaned and len(cleaned) > 2 and not is_still_job_title:
                companies.append(cleaned)
    
    # Also look for specific known company names in the text
    known_companies = [
        'Dave', 'UiPath', 'NEXT Trucking', 'YouTube', 'Salesforce', 'Heroku',
        'Veeva Systems', 'Cohesity', 'Komprise', 'Deloitte', 'IHG Hotels & Resorts',
        'Atomic Invest', 'Stanford', 'University of California', 'Berkeley',
        'University of Texas at Austin', 'Hanyang University', 'University of Southern California',
        'Cookman University', 'Leo University', 'University of Oxford', 'Belhaven University',
        'Atlanta University'
    ]
    
    for company in known_companies:
        if company.lower() in titles_text.lower() and company not in companies:
            companies.append(company)
    
    # Remove duplicates while preserving order
    seen = set()
    unique_companies = []
    for company in companies:
        company_lower = company.lower().strip()
        if company and company_lower not in seen and len(company.strip()) > 2:
            seen.add(company_lower)
            unique_companies.append(company.strip())
    
    return unique_companies[:10]  # Limit to 10 companies

def parse_universities(uni_text):
    """Parse universities from semicolon-separated text."""
    if not uni_text:
        return []
    
    universities = []
    parts = uni_text.split(';')
    
    for part in parts:
        part = part.strip()
        # Remove "Education" prefix if present
        part = re.sub(r'^Education\s+', '', part, flags=re.IGNORECASE)
        if part and len(part) > 2:
            universities.append(part)
    
    # Remove duplicates
    seen = set()
    unique_unis = []
    for uni in universities:
        if uni and uni.lower() not in [u.lower() for u in seen]:
            seen.add(uni.lower())
            unique_unis.append(uni)
    
    return unique_unis[:10]  # Limit to 10 universities

def parse_fields_of_study(fields_text):
    """Parse fields of study from semicolon-separated text."""
    if not fields_text:
        return []
    
    fields = []
    parts = fields_text.split(';')
    
    for part in parts:
        part = part.strip()
        if part and len(part) > 2:
            fields.append(part)
    
    return fields[:10]  # Limit to 10 fields

def calculate_total_experience(row_data):
    """Calculate total years of experience from tenure data."""
    # This is a placeholder - would need more sophisticated calculation
    # For now, try to extract from existing data or calculate from dates
    total_years = row_data.get('Total Years full time experience', '')
    
    if total_years and str(total_years).isdigit():
        return int(total_years)
    
    # Could calculate from date ranges if available
    return None

def process_csv(input_file, output_file):
    """Process the CSV file and restructure it."""
    
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    
    # Determine max number of companies, universities, and fields
    max_companies = 1  # At least 1 column
    max_universities = 1  # At least 1 column
    max_fields = 1  # At least 1 column
    
    for row in rows:
        companies = parse_companies_from_titles(row.get('Previous title(s)', ''))
        universities = parse_universities(row.get('University', ''))
        fields = parse_fields_of_study(row.get('Fields of Study', ''))
        
        max_companies = max(max_companies, len(companies))
        max_universities = max(max_universities, len(universities))
        max_fields = max(max_fields, len(fields))
    
    # Create new header
    new_headers = [
        'Linkedin URL',
        'Full Name',
        'Current Company',
        'Current Company Start Date',
        'Current Company End Date',
        'Current Company Tenure Years',
        'Current Company Tenure Months',
        'Job title',
        'Location',
        'Previous target company',
        'Previous target company Start Date',
        'Previous target company End Date',
        'Previous target company Tenure Years',
        'Previous target company Tenure Months',
        'Tenure at previous target (Year start to year end)',
    ]
    
    # Add company columns
    for i in range(1, max_companies + 1):
        new_headers.append(f'Company {i}')
    
    # Add previous titles (keep original)
    new_headers.append('Previous title(s)')
    
    # Add experience
    new_headers.append('Total Years full time experience')
    
    # Add university columns
    for i in range(1, max_universities + 1):
        new_headers.append(f'University {i}')
    
    # Add field of study columns
    for i in range(1, max_fields + 1):
        new_headers.append(f'Field of Study {i}')
    
    # Add other columns
    new_headers.extend([
        'Degrees',
        'Year of Undergrad Graduation',
        'Submitted At',
        'Raw Data'
    ])
    
    # Process rows
    new_rows = []
    for row in rows:
        new_row = OrderedDict()
        
        # Basic info
        new_row['Linkedin URL'] = row.get('Linkedin URL', '')
        new_row['Full Name'] = row.get('Full Name', '')
        
        # Current Company - extract name and dates
        current_company_raw = row.get('Current company', '')
        # Try to extract company name - if not found in current_company field, check location or job title context
        company_name = extract_company_name(current_company_raw)
        if not company_name:
            # Sometimes company name is in location field (e.g., "Atomic Invest Stanford")
            location = row.get('Location', '')
            # Check if location contains a company name (before location details)
            location_parts = location.split(',')
            if location_parts:
                # Take the first part and check if it looks like a company name
                first_part = location_parts[0].strip()
                # Common location words to exclude
                location_words = ['united states', 'california', 'new york', 'texas', 'georgia', 
                                'washington', 'massachusetts', 'boston', 'los angeles', 
                                'san francisco', 'seattle', 'austin', 'atlanta', 'san jose', 
                                'bay area', 'stanford', 'education']
                # If first part doesn't contain location words and has reasonable length, might be company
                if first_part and len(first_part.split()) <= 4:
                    first_lower = first_part.lower()
                    if not any(word in first_lower for word in location_words):
                        # Check if it's capitalized (likely a proper noun/company)
                        if first_part[0].isupper():
                            company_name = first_part
        
        new_row['Current Company'] = company_name
        start_date, end_date = extract_date_range(current_company_raw)
        new_row['Current Company Start Date'] = start_date or ''
        new_row['Current Company End Date'] = end_date or ''
        years, months = extract_tenure_years_months(current_company_raw)
        # Also check Years in current company column as fallback
        if years is None:
            years_str = row.get('Years in current company', '').strip()
            if years_str and years_str.isdigit():
                years = int(years_str)
        new_row['Current Company Tenure Years'] = years if years is not None else ''
        new_row['Current Company Tenure Months'] = months if months is not None else ''
        
        # Job title
        new_row['Job title'] = row.get('Job title', '')
        
        # Location
        new_row['Location'] = row.get('Location', '')
        
        # Previous target company
        prev_target_raw = row.get('Previous target company', '')
        new_row['Previous target company'] = extract_company_name(prev_target_raw)
        prev_start, prev_end = extract_date_range(prev_target_raw)
        new_row['Previous target company Start Date'] = prev_start or ''
        new_row['Previous target company End Date'] = prev_end or ''
        prev_years, prev_months = extract_tenure_years_months(prev_target_raw)
        new_row['Previous target company Tenure Years'] = prev_years if prev_years is not None else ''
        new_row['Previous target company Tenure Months'] = prev_months if prev_months is not None else ''
        new_row['Tenure at previous target (Year start to year end)'] = row.get('Tenure at previous target (Year start to year end)', '')
        
        # Companies from Previous title(s)
        companies = parse_companies_from_titles(row.get('Previous title(s)', ''))
        for i in range(1, max_companies + 1):
            new_row[f'Company {i}'] = companies[i-1] if i <= len(companies) else ''
        
        # Previous titles (keep original)
        new_row['Previous title(s)'] = row.get('Previous title(s)', '')
        
        # Total experience
        total_exp = calculate_total_experience(row)
        new_row['Total Years full time experience'] = total_exp if total_exp is not None else row.get('Total Years full time experience', '')
        
        # Universities
        universities = parse_universities(row.get('University', ''))
        for i in range(1, max_universities + 1):
            new_row[f'University {i}'] = universities[i-1] if i <= len(universities) else ''
        
        # Fields of study
        fields = parse_fields_of_study(row.get('Fields of Study', ''))
        for i in range(1, max_fields + 1):
            new_row[f'Field of Study {i}'] = fields[i-1] if i <= len(fields) else ''
        
        # Other fields
        new_row['Degrees'] = row.get('Degrees', '')
        new_row['Year of Undergrad Graduation'] = row.get('Year of Undergrad Graduation', '')
        new_row['Submitted At'] = row.get('Submitted At', '')
        
        # Raw data - preserve original row as JSON-like string
        import json
        new_row['Raw Data'] = json.dumps(row, ensure_ascii=False)
        
        new_rows.append(new_row)
    
    # Write output
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=new_headers)
        writer.writeheader()
        writer.writerows(new_rows)
    
    print(f"Processed {len(new_rows)} rows")
    print(f"Output written to {output_file}")

if __name__ == '__main__':
    input_file = '/Users/patrick/extension/data/Vetted_Candidates - Sheet1.csv'
    output_file = '/Users/patrick/extension/data/Vetted_Candidates - Sheet1_fixed.csv'
    process_csv(input_file, output_file)

