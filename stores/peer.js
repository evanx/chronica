// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redex/LICENSE

const logger = Loggers.create(module.filename);

export function create() {

   const state = {
      peers: new Map()
   };

   const those = {
      async pub() {
         return state.peers;
      },
      get peers() {
         return state.peers;
      },
      add(peer) {
         assert(peer.name, 'name: ' + Object.keys(peer).join(', '));
         if (!peer.label) {
            peer.label = peer.name;
         }
         state.peers.set(peer.name, peer);
      }
   };

   return those;
}
