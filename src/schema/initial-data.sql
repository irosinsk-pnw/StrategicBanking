insert into CUSTOMER (Ssn, Name, Phone, Address) values
    ('123456789', 'John Smith', '8001234567', '1234 Main Street, Townville, IN'),
    ('111223333', 'Steven Stone', '1239876543', '3 Center Avenue, Mossdeep City, HO'),
    ('999887777', 'Jim Nagy', '2199892888', '2200 169th Street, Hammond, IN'),
    ('456454567', 'James Jones', '1238384567', '987 3rd Street, Podunk, IL'),
    ('456452345', 'Jane Jones', '1238384567', '987 3rd Street, Podunk, IL'),
    ('456453456', 'James Jones Jr.', '1238385678', '987 3rd Street, Podunk, IL'),
    ('843671129', 'John Wilson', '7634122448', '2356 Money St, Naperville, IN'),
    ('532164895', 'Rick Brian', '4453216579', '2356 PierPoint Rd, Fort Wayne, IN'),
    ('784531246', 'Liam Clarke', '2137842035', '452 Lincoln Ave, Oak Park, IL'),
    ('200647823', 'Steve Powell', '7023651285', '45638 Sandview St, Grand Rapids, MI'),
    ('123054678', 'Jack Rodgers', '1323486204', '1035 Mt.Flight Rd, Fort Wayne, IN'),
    ('784105562', 'Mary Louise', '7023651285', '4215 Ralph Ave, Bloomington, IN');

insert into EXTERN_BANK (Name, Address) values
    ('JP Morgan Chase', '383 Madison Avenue, New York, NY'),
    ('Bank of America', 'BofA Corporate Center, Charllotte, NC'),
    ('Citigroup', '388 Greenwich Street, New York, NY'),
    ('Goldman Sachs', '200 West Street, New York, NY'),
    ('Morgan Stanley', 'Morgan Stanley Building, New York, NY'),
    ('ProfitBanking', 'Liberty Rd, Indianapolis, IN'),
    ('Sky is the Limit Bank', 'Mississippi St, Naperville, IL'),
    ('12/5 Bank', 'Sunset Dr, Indianapolis, IN'),
    ('MoneyLand', 'Washington Ave, Lansing, MI'),
    ('Victory in Sight Bank', 'Louiseville St, West Lafeyette, IN'),
    ('CommonBanker', 'Jefferson St, Fort Wayne, IN');

insert into RATE (Rate_type, Amount) values
    ('LowYieldSavings', .001),
    ('HighYieldSavings', .075),
    ('MoneyMarket', .072),
    ('CD', .0412),
    ('CorpDemand', .0582),
    ('RetailDemand', .0737),
    ('Checking', 0),
    ('30YearFixed', .0346),
    ('30YearVariable', .0626),
    ('15YearFixed', .0549),
    ('15YearVariable', .0721),
    ('HighRiskLoan', .0651),
    ('LowRiskLoan', .0434),
    ('VCLoan', .35),
    ('FedFundsOvernight', .0853);

insert into DEPOSIT (Acct_num, Balance, Rate, Acct_type, Fee, Deposit_type) values
    ('0000000001', 10000, 'MoneyMarket', 'Money market', 0, 'customer'),
    ('0000000002', 56294.63, 'HighYieldSavings', 'High yield savings', 0, 'customer'),
    ('0000000003', 5034.05, 'Checking', 'Standard checking', 0, 'customer'),
    ('0000000004', -37.42, 'Checking', 'Standard checking', 25, 'customer'),
    ('0000000005', 25391.82, 'HighYieldSavings', 'High yield savings', 0, 'customer'),
    ('0000000006', 100, 'LowYieldSavings', 'Junior savings', 0, 'customer'),
    ('1000023548', 1218.32, 'MoneyMarket', 'Money market', 0, 'customer'),
    ('6230259748', 8783.32, 'CorpDemand', 'Corporate demand deposit', 0, 'customer'),
    ('1235423548', 3479.85, 'RetailDemand', 'Retail demand deposit', 0, 'customer'),
    ('4235686587', 2125.85, 'CD', '12-month CD', 0, 'customer');

insert into CUST_ACCT (Ssn, Acct_num) values
    ('123456789', '0000000001'),
    ('111223333', '0000000002'),
    ('111223333', '0000000003'),
    ('999887777', '0000000004'),
    ('456454567', '0000000005'),
    ('456452345', '0000000005'),
    ('456454567', '0000000006'),
    ('456453456', '0000000006'),
    ('843671129', '1000023548'),
    ('784531246', '4235686587'),
    ('200647823', '6230259748'),
    ('532164895', '1235423548');


insert into DEPOSIT (Acct_num, Balance, Rate, Bank_name, Deposit_type) values
    ('1000000001', 250000, 'FedFundsOvernight', 'JP Morgan Chase', 'fedfunds'),
    ('1000000002', 100000, 'FedFundsOvernight', 'Bank of America', 'fedfunds'),
    ('1000000003', 150000, 'FedFundsOvernight', 'Citigroup', 'fedfunds'),
    ('9984221368', 157000, 'FedFundsOvernight', '12/5 Bank', 'fedfunds');

insert into LOAN (Loan_num, Balance, Payment_due, Rate) values
    ('8000000001', 10000, 600, 'LowRiskLoan'),
    ('8000000002', 2389, 300, 'HighRiskLoan'),
    ('8000000003', 360381.03, 1800, '30YearVariable'),
    ('1312321345', 21240, 875, 'LowRiskLoan'),
    ('2121315457', 200000, 1267, '30YearFixed'),
    ('8513578981', 324515, 3200, '30YearVariable'),
    ('1235578122', 245020, 1800, '15YearFixed'),
    ('5232314578', 500525, 4177, 'VCLoan'),
    ('9000000001', 250000, null, 'FedFundsOvernight'),
    ('9000000002', 50000, null, 'FedFundsOvernight'),
    ('9000000003', 175000, null, 'FedFundsOvernight'),
    ('9000000004', 125000, null, 'FedFundsOvernight'),
    ('9000000005', 150000, null, 'FedFundsOvernight');

insert into CUST_LOAN (Loan_num, Ssn, Months_remaining, Rate_type, Loan_type, Fee) values
    ('8000000001', '456454567', 18, 'fixed', 'Vehicle loan', 0),
    ('8000000002', '999887777', 9, 'fixed', 'Personal loan', 25),
    ('8000000003', '999887777', 203, 'variable', '30 year variable mortgage', 0),
    ('1312321345', '843671129', 24, 'fixed', 'Personal loan', 0),
    ('2121315457', '532164895', 158, 'fixed', '30 year fixed mortgage', 0),
    ('8513578981', '784531246', 101, 'variable', '30 year variable mortgage', 100),
    ('1235578122', '200647823', 136, 'fixed', '15 year variable mortgage', 0),
    ('5232314578', '123054678', 120, 'fixed', 'Venture capital loan', 0);


insert into FED_FUNDS_LOAN (Loan_num, Bank_name) values
    ('9000000001', 'Morgan Stanley'),
    ('9000000002', 'Goldman Sachs'),
    ('9000000003', 'ProfitBanking'),
    ('9000000004', 'CommonBanker'),
    ('9000000005', 'Sky is the Limit Bank');