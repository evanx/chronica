

export function assign(target, source) {
   lodash.forEach(source, function(item, key) {
      target[key] = item;
   });
   return target;
}
