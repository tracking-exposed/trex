const elasticsearch=require('elasticsearch');

function ElasticsearchClient(conf){
    this.hosts = conf.hosts;
    this.client =  new elasticsearch.Client({  
        hosts: this.hosts
    });

    this.configuration = {
        originalConfiguration: conf, 
        defaultIndex: "fbtrex"
    };
}

ElasticsearchClient.prototype.sendDebug = function(objectFeed){
    const indexFeed = objectFeed.index;
    delete objectFeed.index;
    
    return this.client.index({  
        index: indexFeed,
        id: objectFeed.id,
        type: 'doc',
        body: objectFeed
    });
   
}

module.exports = ElasticsearchClient
