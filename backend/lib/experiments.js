/*
 * this library is a mixture between some experiment shared 
 * functions used to play with experiment, directives, etc
 */
const _ = require('lodash');
const nconf = require('nconf');
const debug = require('debug')('lib:experiments');
// const moment = require('moment');

const utils = require('./utils');
const mongo3 = require('./mongo3');

async function pickDirective(experimentId) {
    const mongoc = await mongo3.clientConnect({concurrency: 1});
    const rb = await mongo3.readOne(mongoc,
        nconf.get('schema').directives, { experimentId });
    await mongoc.close();
    return rb;
}

                                                                        
async function registerDirective(links, directiveType) {                
    debug("registering directived %j %s", links, directiveType);
    /* this API is called by guardoni when --csv is used,               
       the API is POST localhost:9000/api/v3/directives/comparison */   
    const experimentId = utils.hash({                                   
        type: directiveType,                                            
        links,                                                          
    });                                                                 
    const mongoc = await mongo3.clientConnect({concurrency: 1});        
    const exist = await mongo3.readOne(mongoc,                          
        nconf.get('schema').directives, {                               
            experimentId                                                
        });                                                             
                                                                        
    if(exist && exist.experimentId) {                                   
        debug("Directive already found in the DB!")                     
        await mongoc.close();                                           
        return {                                                        
            status: 'exist',                                            
            experimentId: exist.experimentId,                           
            since: exist.when,                                          
            exist,
        };                                                              
    }                                                                   
                                                                        
    /* else, we don't had such data, hence */                           
    await mongo3.writeOne(mongoc,                                       
        nconf.get('schema').directives, {                               
        when: new Date(),                                               
        directiveType,                                                  
        links,                                                          
        experimentId,                                                   
    })                                                                  
    await mongoc.close();                                               
    debug("Registered directive %s|%s", directiveType, experimentId);   
    return { status: 'created', experimentId };                         
}                                                                       

module.exports = {
    pickDirective,
    registerDirective,
}