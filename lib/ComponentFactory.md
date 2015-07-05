
### ComponentFactory

We instantiate components via a factory, which decorates their config using defaults from YAML files.

We read the configuration file e.g. `~/etc/chronica.yaml`

https://github.com/evanx/chronica/blob/master/etc/sample-config.yaml

and decorate this with `ComponentFactory.yaml` defaults.

https://github.com/evanx/chronica/blob/master/lib/ComponentFactory.yaml

We create this factory using this root configuration:

```javascript
export async function create(rootConfig) {

   async function init() {
      await initComponents();
      await resolveRequiredComponents();
      await startComponents();
      await schedule();
```

We initialise the configured components:
```javascript
   async function initComponents() {
      return await* state.componentNames.map(async (name) => {
```

We start the configured components:
```javascript
   async function startComponents() {
      state.startedNames = await* state.componentNames.map(async (name) => {
         let component = state.components[name];
         await Promises.timeout(name, rootConfig.componentStartTimeout,
                  state.components[name].start());
            return name;
      });
   }
```
where we timeout the components' `start()` async functions.

We schedule a timeout and interval on components, if configured.
```javascript
function schedule() {
   for (let [name, config] of state.configs) {
      if (config.scheduledTimeout) {
         state.scheduledTimeouts.set(name, setTimeout(() => {
            state.processors[name].scheduledTimeout();
         }, config.scheduledTimeout));
      }
      let scheduledInterval = config.scheduledInterval;
      if (scheduledInterval) {
         state.scheduledIntervals.set(name, setInterval(() => {
            state.processors[name].scheduledInterval();
         }, config.scheduledInterval));
```
where we record the ids e.g. to cancel in the event of an orderly shutdown.

```javascript
async end() {
   for (let [name, id] of state.scheduledIntervals) {
      clearInterval(id);
   }
   for (let [name, id] of state.scheduledTimeouts) {
      clearTimeout(id);
   }
   return lodash(state.startedNames).reverse().map(async (name) => {
      try {
         return await Promises.timeout(name, rootConfig.componentEndTimeout,
            state.components[name].end());
      } catch (err) {
         logger.warn('end:', name);
```
where we timeout the components' `end()` async functions.

See: https://github.com/evanx/chronica/blob/master/lib/ComponentFactory.js


### Checking URLs

We perform an HTTP HEAD request and check that the response has status code 200.

See overview: https://github.com/evanx/chronica/blob/master/lib/README.md
