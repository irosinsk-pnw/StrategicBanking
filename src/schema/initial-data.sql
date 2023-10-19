insert into CUSTOMER (Ssn, Name, Phone, Address) values
    ('123456789', 'John Smith', '8001234567', '1234 Main Street, Townville, IN'),
    ('111223333', 'Steven Stone', '1239876543', '3 Center Avenue, Mossdeep City, HO'),
    ('999887777', 'Jim Nagy', '2199892888', '2200 169th Street, Hammond, IN'),
    ('456454567', 'James Jones', '1238384567', '987 3rd Street, Podunk, IL'),
    ('456452345', 'Jane Jones', '1238384567', '987 3rd Street, Podunk, IL'),
    ('456453456', 'James Jones Jr.', '1238385678', '987 3rd Street, Podunk, IL');

insert into EXTERN_BANK (Name, Address) values
    ('JP Morgan Chase', '383 Madison Avenue, New York, NY'),
    ('Bank of America', 'BofA Corporate Center, Charllotte, NC'),
    ('Citigroup', '388 Greenwich Street, New York, NY'),
    ('Goldman Sachs', '200 West Street, New York, NY'),
    ('Morgan Stanley', 'Morgan Stanley Building, New York, NY');

insert into RATE (Rate_type, Amount) values
    ('LowYieldSavings', .001),
    ('HighYieldSavings', .06),
    ('MoneyMarket', .05),
    ('Checking', 0),
    ('30YearFixed', .07),
    ('30YearVariable', .06),
    ('15YearFixed', .08),
    ('15YearVariable', .07),
    ('HighRiskLoan', .15),
    ('LowRiskLoan', .1),
    ('FedFundsOvernight', .055);

insert into DEPOSIT (Acct_num, Balance, Rate, Acct_type, Fee, Deposit_type) values
    ('0000000001', 10000, 'MoneyMarket', 'Money market', 0, 'customer'),
    ('0000000002', 56294.63, 'HighYieldSavings', 'High yield savings', 0, 'customer'),
    ('0000000003', 5034.05, 'Checking', 'Standard checking', 0, 'customer'),
    ('0000000004', -37.42, 'Checking', 'Standard checking', 25, 'customer'),
    ('0000000005', 25391.82, 'HighYieldSavings', 'High yield savings', 0, 'customer'),
    ('0000000006', 100, 'LowYieldSavings', 'Junior savings', 0, 'customer');

insert into CUST_ACCT (Ssn, Acct_num) values
    ('123456789', '0000000001'),
    ('111223333', '0000000002'),
    ('111223333', '0000000003'),
    ('999887777', '0000000004'),
    ('456454567', '0000000005'),
    ('456452345', '0000000005'),
    ('456454567', '0000000006'),
    ('456453456', '0000000006');

insert into DEPOSIT (Acct_num, Balance, Rate, Bank_name, Deposit_type) values
    ('1000000001', 250000, 'FedFundsOvernight', 'JP Morgan Chase', 'fedfunds'),
    ('1000000002', 100000, 'FedFundsOvernight', 'Bank of America', 'fedfunds'),
    ('1000000003', 150000, 'FedFundsOvernight', 'Citigroup', 'fedfunds');

insert into LOAN (Loan_num, Balance, Payment_due, Rate) values
    ('8000000001', 10000, 600, 'LowRiskLoan'),
    ('8000000002', 2389, 300, 'HighRiskLoan'),
    ('8000000003', 360381.03, 1800, '30YearVariable'),
    ('9000000001', 250000, null, 'FedFundsOvernight'),
    ('9000000002', 50000, null, 'FedFundsOvernight');

insert into CUST_LOAN (Loan_num, Ssn, Months_remaining, Rate_type, Loan_type, Fee) values
    ('8000000001', '456454567', 18, 'fixed', 'Vehicle loan', 0),
    ('8000000002', '999887777', 9, 'fixed', 'Personal loan', 25),
    ('8000000003', '999887777', 203, 'variable', '30 year variable mortgage', 0);

insert into FED_FUNDS_LOAN (Loan_num, Bank_name) values
    ('9000000001', 'Morgan Stanley'),
    ('9000000002', 'Goldman Sachs');