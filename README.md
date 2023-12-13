# StrategicBanking
This is our Database Systems class final project, a banking system

The project documentation, including E/R diagram, schema, and query examples, can be found in `StrategicBanking/doc`

The source code, including frontend and initial database state, can be found in `StrategicBanking/src`

## Running
Our web application requires Node.js, MySQL or MariaDB, and the dependencies listed in `package.json`.  
The application assumes you have an SQL database named `Bank`, and database users `manager@localhost` with password `54321` and `customer@localhost` with password `12345`.  
To run the application, ensure that the SQL server is running, and from working directory `StrategicBanking/src/webapp` run `node index.js`.
