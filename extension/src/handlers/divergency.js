import pseudonym from '../pseudonym';

var setPseudo = function(response) {
    // this do not get ever called, because I didn't yet mastered the sendMessages
    // and I'm doing some cargo cult programming here 
    //
    // -- confession of a sinful programmer
    console.log("saving the pseudonym from:", response);
    pseudonym.set(response);
};

export function register (hub) {
    hub.register('handshakeResponse', setPseudo);
};
