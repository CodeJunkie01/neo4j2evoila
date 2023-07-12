# Setup
## Download json files from Neo4J:
  - connect to Neo4J Webinterface
  
### To Download Nodes:
  - execute Query "MATCH (n) RETURN n LIMIT 500" (500 should be sufficient if not, increase the limit)
  - the query will return a new window with the result. switch to "Table" view in the left menu
  - click on the download button in the top right of the window and select "Export JSON"
  
### To Download Paths:
  - execute Query "MATCH p=()-->() RETURN p LIMIT 500" (500 should be sufficient if not, increase the limit)
  - the query will return a new window with the result. switch to "Table" view in the left menu
  - click on the download button in the top right of the window and select "Export JSON"
  
## Inside your local repo:
- create the folders `~/data` and `~/results`
- paste the json files into the folder `~/data/`: nodes as `nodes.json` and paths as `paths.json`
- run command "node convert.js" (node.js must be installed)

## To publish to prod:
  - connect to remote host via ssh
  - remove questionaire config in docker compose folder
  - from your local folder execute `scp -rp results user@domain.com:/home/WeKI-GO-v1.9.2/WeKI-GO-docker-compose/questionaire-config` where user@domain.com has to be replaced with real connection credentials
  - afterwards restart docker with `docker compose down` and `docker compose up -d`
