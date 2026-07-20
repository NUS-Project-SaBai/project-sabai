INSERT INTO medication_stock (
    medication_brand_id, 
    quantity, 
    expiry, 
    location, 
    stock_status
) VALUES
(1, 200, '2026-12-31 00:00:00', 'Main Pharmacy Shelf A1', 'active'),
(1, 150, '2026-06-30 00:00:00', 'Main Pharmacy Shelf A2', 'active'),
(2, 100, '2025-11-15 00:00:00', 'Ward 3 Cabinet', 'active'),
(3, 80,  '2025-09-01 00:00:00', 'Ward 5 Cabinet', 'active'),
(4, 120, '2026-03-20 00:00:00', 'Emergency Room Storage', 'active'),
(5, 300, '2027-01-10 00:00:00', 'Diabetes Clinic Storage', 'active'),
(6, 90,  '2026-08-18 00:00:00', 'Cardiology Unit Cabinet', 'active');
