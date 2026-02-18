INSERT INTO "patients" (
    "village_code_id", "name", "identification_number", "contact_no", "gender", "date_of_birth", "drug_allergy", "poor", "bs2", "sabai_card"
) VALUES
-- PC Village patients
(1, 'Somchai Phuket', 'ID001', '08-1234-5678', 'male', '1985-03-15', 'Penicillin', 'yes', 'no', 'yes'),
(1, 'Niran Chiang', 'ID002', '08-2345-6789', 'male', '1992-07-22', 'None', 'no', 'yes', 'no'),
(1, 'Arunee Bangkok', 'ID003', '08-3456-7890', 'female', '1988-11-30', 'Aspirin', 'yes', 'no', 'yes'),

-- CA Village patients
(2, 'Wiroj Rayong', 'ID004', '08-4567-8901', 'male', '1980-05-12', 'Sulfonamides', 'no', 'yes', 'yes'),
(2, 'Orawan Songkhla', 'ID005', NULL, 'female', '1995-09-08', 'None', 'yes', 'no', 'no'),
(2, 'Dhammachai Krabi', 'ID006', '08-5678-9012', 'male', '1975-02-18', 'None', 'no', 'no', 'yes'),

-- TK Village patients
(3, 'Pranee Phangnga', 'ID007', '08-6789-0123', 'female', '1990-12-25', 'Iodine', 'yes', 'yes', 'yes'),
(3, 'Krit Phuket', 'ID008', '08-7890-1234', 'male', '1987-04-10', 'None', 'no', 'no', 'no'),

-- TT Village patients
(5, 'Suda Surin', 'ID009', '08-8901-2345', 'female', '1993-06-20', 'Penicillin, Cephalosporin', 'yes', 'yes', 'yes'),
(5, 'Boonma Nakhon', 'ID010', NULL, 'male', '1982-10-05', 'None', 'no', 'yes', 'no'),

-- SV Village patients
(6, 'Nittha Yasothon', 'ID011', '08-9012-3456', 'female', '1989-08-14', 'None', 'yes', 'no', 'yes'),
(6, 'Sattaya Amnat', 'ID012', '08-0123-4567', 'male', '1994-01-28', 'Aspirin, NSAID', 'no', 'no', 'no'),

-- SB Village patients
(7, 'Malee Samut', 'ID013', '08-1234-5679', 'female', '1986-09-03', 'None', 'yes', 'yes', 'yes'),
(7, 'Chalern Pathum', 'ID014', '08-2345-6780', 'male', '1991-11-17', 'Latex', 'no', 'no', 'yes'),
(7, 'Pairot Bangkok', 'ID015', NULL, 'male', '1979-03-22', 'None', 'yes', 'yes', 'no');