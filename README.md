

Node.js WEB application for test [tabaga](https://github.com/megion/tabaga) GUI controls   

## Installation

Install MongoDb server [mongodb](http://www.mongodb.org/)

Clone project, then install the dependencies:

    $ git clone https://github.com/megion/mychat.git
    $ cd mychat
    $ git submodule init
    $ git submodule update
    $ git submodule submodule foreach git checkout master
    $ npm install 
    
## Prepare mongodb database

Configure database connection settings in file `config/config.json`. Run fill database script:
   
    $ NODE_PATH=. node createDb

## Run


    $ NODE_PATH=. node app
    
or 
    
    $ NODE_ENV=development NODE_PATH=. node app
    
    
    
