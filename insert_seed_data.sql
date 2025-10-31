-- ============================================================
-- 🚀 Compliance Counsel — Database Seed Script
-- Purpose: Truncate and seed 'companies' and 'users' tables
-- Author: Jubi Ranka | Date: 2025-10-29
-- ============================================================

-- ⚠️ Disable FK checks temporarily
SET session_replication_role = 'replica';

-- ============================================================
-- 🧹 Step 1: Clean existing data
-- ============================================================
TRUNCATE TABLE users RESTART IDENTITY CASCADE;
TRUNCATE TABLE companies RESTART IDENTITY CASCADE;

-- ============================================================
-- 🏢 Step 2: Insert Companies
-- ============================================================
INSERT INTO companies (
    name, status, cin_number, industry_type,
    authorized_capital, paid_up_capital, address, registration_date,
    director_name, director_email, company_secretary, auditor_name,
    notes, created_at, updated_at
) VALUES
('Infosys Limited', 'public', 'L85110KA1981PLC013115', 'Information Technology',
 24000000000, 20772000000, 'Electronics City, Hosur Road, Bengaluru 560100', '1981-07-02',
 'Salil S. Parekh', 'investors@infosys.com', 'Aditya Verma', 'Aditya Verma',
 'Leading global IT services company', '2025-10-23', '2025-10-24'),

('Reliance Industries Limited', 'public', 'L17110MH1973PLC019786', 'Conglomerate',
 50000000000, 13532470000, '3rd Floor, Maker Chambers IV, 222 Nariman Point, Mumbai 400021', '1973-05-08',
 'Mukesh D. Ambani', 'investor.relations@ril.com', 'Neha Kapoor', 'Neha Kapoor',
 'India’s largest listed company by market cap', '2025-10-23', '2025-10-24'),

('Tata Consultancy Services Limited', 'public', 'L22210MH1995PLC084781', 'Information Technology',
 6000000000, 3660000000, '9th Floor, Nirmal Building, Nariman Point, Mumbai 400021', '1995-01-19',
 'K Krithivasan', 'corporate.office@tcs.com', 'Rahul Chatterjee', 'Rahul Chatterjee',
 'Top IT services firm', '2025-10-23', '2025-10-24'),

('Wipro Limited', 'public', 'L32102KA1945PLC020800', 'Information Technology',
 25000000000, 10970000000, 'Doddakannelli, Sarjapur Road, Bengaluru 560035', '1945-12-29',
 'Thierry Delaporte', 'investors@wipro.com', 'Kavya Menon', 'Kavya Menon',
 'Global IT & consulting firm', '2025-10-23', '2025-10-24'),

('HDFC Bank Limited', 'public', 'L65920MH1994PLC080618', 'Banking & Financial Services',
 65000000000, 55000000000, 'HDFC Bank House, Senapati Bapat Marg, Lower Parel (West), Mumbai 400013', '1994-08-30',
 'Sashidhar Jagdishan', 'investor.relations@hdfcbank.com', 'Arvind Krishnan', 'Arvind Krishnan',
 'Major private sector bank', '2025-10-23', '2025-10-24'),

('Biocon Limited', 'public', 'L24234KA1978PLC003417', 'Pharmaceuticals',
 500000000, 300000000, '20th KM, Hosur Road, Electronic City, Bengaluru 560100', '1978-11-29',
 'Kiran Mazumdar-Shaw', 'investor.relations@biocon.com', 'Pooja Iyer', 'Pooja Iyer',
 'Biopharma leader', '2025-10-23', '2025-10-24');

-- ============================================================
-- 👩‍💼 Step 3: Insert Users
-- ============================================================
INSERT INTO users (
    name, email, password_hash, role, company_name,
    designation, created_at, updated_at
) VALUES
('Rhea Mehta', 'rhea.mehta@compliancecounsel.in', '$2b$12$1axQf3g7K…', 'ADMIN', 'Compliance Counsel India', 'Compliance Officer', '2025-03-15 10:32', '2025-10-10 17:45'),
('Arjun Nair', 'arjun.nair@compliancecounsel.in', '$2b$12$8YfsaZ9Lk…', 'USER', 'Compliance Counsel India', 'Legal Associate', '2025-04-01 11:05', '2025-10-11 18:10'),
('Priya Shah', 'priya.shah@compliancecounsel.in', '$2b$12$0DsTQmUvR…', 'VIEWER', 'Compliance Counsel India', 'Research Analyst', '2025-05-12 09:40', '2025-10-15 14:22'),
('Sneha Pillai', 'sneha.pillai@compliancecounsel.in', '$2b$12$VtUs7kEHi…', 'ADMIN', 'Compliance Counsel India', 'Head of Legal', '2025-02-20 09:10', '2025-10-22 16:30'),
('Aditya Verma', 'aditya.verma@infosys.com', '$2b$12$4bRkD2vTn…', 'USER', 'Infosys Limited', 'Corporate Counsel', '2025-03-22 13:00', '2025-10-23 10:20'),
('Neha Kapoor', 'neha.kapoor@ril.com', '$2b$12$7uGsP1nEh…', 'VIEWER', 'Reliance Industries Limited', 'Assistant Legal Manager', '2025-04-05 09:45', '2025-10-21 15:55'),
('Rahul Chatterjee', 'rahul.chatterjee@tcs.com', '$2b$12$XyUu1pTkJ…', 'USER', 'Tata Consultancy Services Limited', 'Compliance Executive', '2025-05-28 10:10', '2025-10-24 11:45'),
('Kavya Menon', 'kavya.menon@wipro.com', '$2b$12$ZkOaP5rBn…', 'VIEWER', 'Wipro Limited', 'Legal Assistant', '2025-04-17 16:40', '2025-10-20 10:55'),
('Arvind Krishnan', 'arvind.krishnan@hdfcbank.com', '$2b$12$DsRzU6nWp…', 'ADMIN', 'HDFC Bank Limited', 'Sr. Compliance Officer', '2025-03-11 08:15', '2025-10-22 17:00'),
('Pooja Iyer', 'pooja.iyer@biocon.com', '$2b$12$5nLhD1pVt…', 'USER', 'Biocon Limited', 'Regulatory Affairs Lead', '2025-04-20 12:30', '2025-10-19 16:10');

-- ============================================================
-- ✅ Step 4: Restore FK enforcement
-- ============================================================
SET session_replication_role = 'origin';
