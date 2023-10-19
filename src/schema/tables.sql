create table CUSTOMER (
    Ssn varchar(9) primary key,
    Name varchar(255) not null,
    Phone varchar(15) not null,
    Address varchar(255) not null
);

create table EXTERN_BANK (
    Name varchar(255) primary key,
    Address varchar(255) not null
);

create table RATE (
    Rate_type varchar(255) primary key,
    Amount decimal not null
);

create table DEPOSIT (
    Acct_num varchar(10) primary key,
    Balance decimal default 0,
    Rate varchar(255) not null,
    Bank_name varchar(255) unique,
    Acct_type varchar(255),
    Fee decimal,
    Deposit_type enum('customer','fedfunds') not null,

    foreign key (Bank_name) references EXTERN_BANK (Name)
        on update cascade
        on delete restrict,

    foreign key (Rate) references RATE (Rate_type)
        on update cascade
        on delete restrict
);

create table CUST_ACCT (
    Ssn varchar(9) not null,
    Acct_num varchar(10) not null,

    foreign key (Ssn) references CUSTOMER (Ssn)
        on update cascade
        on delete restrict,

    foreign key (Acct_num) references DEPOSIT (Acct_num)
        on update cascade
        on delete cascade
);

create table LOAN (
    Loan_num varchar(10) primary key,
    Balance decimal,
    Payment_due decimal,
    Rate varchar(255) not null,

    foreign key (Rate) references RATE (Rate_type)
        on update cascade
        on delete restrict
);

create table CUST_LOAN (
    Loan_num varchar(10) primary key,
    Ssn varchar(9) not null,
    Months_remaining int not null,
    Rate_type enum('fixed','variable') not null,
    Loan_type varchar(255) not null,
    Fee decimal default 0,

    foreign key (Loan_num) references LOAN (Loan_num)
        on update cascade
        on delete cascade,

    foreign key (Ssn) references CUSTOMER (Ssn)
        on update cascade
        on delete restrict
);

create table FED_FUNDS_LOAN (
    Loan_num varchar(10) primary key,
    Bank_name varchar(255) unique not null,

    foreign key (Loan_num) references LOAN (Loan_num)
        on update cascade
        on delete cascade,

    foreign key (Bank_name) references EXTERN_BANK (Name)
        on update cascade
        on delete restrict
);