### Setup
## Download json files from Neo4J:
  - connect to Neo4J Webinterface
  
# To Download Nodes:
  - execute Query "MATCH (n) RETURN n LIMIT 500" (500 should be sufficient if not, increase the limit)
  - the query will return a new window with the result. switch to "Table" view in the left menu
  - click on the download button in the top right of the window and select "Export JSON"
  
# To Download Paths:
  - execute Query "MATCH p=()-->() RETURN p LIMIT 500" (500 should be sufficient if not, increase the limit)
  - the query will return a new window with the result. switch to "Table" view in the left menu
  - click on the download button in the top right of the window and select "Export JSON"
  
## Inside your local repo:
- create the folders `~/data` and `~/results`
- paste the json files into the folder `~/data/`: nodes as `nodes.json` and paths as `paths.json`
- run command "node convert.js" (node.js must be installed)
