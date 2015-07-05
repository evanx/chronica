
### ComponentFactory

We instantiate components via a factory, which decorates their config using defaults from YAML files.

We create this factory using this root configuration:

```javascript
export async function create(rootConfig) {

   async function init() {
      await initComponents();
      await resolveRequiredComponents();
      await startComponents();
      await schedule();
```

#### Configuration

We read the custom configuration file to boot e.g. `~/etc/chronica.yaml`

https://github.com/evanx/chronica/blob/master/etc/sample-config.yaml

and decorate this with `ComponentFactory.yaml` defaults.

https://github.com/evanx/chronica/blob/master/lib/ComponentFactory.yaml

#### Configuration

We initialise the configured components:
```javascript
async function initComponents() {
   state.componentNames = getComponentNames();
   return await* state.componentNames.map(async (name) => {
      let config = getComponentDefaultConfig(name);
      let componentClassFile = getComponentClassFile(name, config);
      config = await YamlDecorator.decorateClass(componentClassFile, config);
      return await startComponent(name, config, componentClassFile);
   });
}
```
where we decorate the component configuration using a further individual default configuration which be specified for each component e.g. `components/alerter.yaml.` Therefore having the default configuration in `ComponentFactory.yaml` is optional.

The priority of configuration for each component is:
- its section in the custom config e.g. `~/etc/chronica.yaml`
- its section in `lib/ComponentFactory.yaml`
- its own YAML file e.g. `component/alerter.yaml`

If the component is not specified in `~/etc/chronica.yaml` then it will not started - nor any components that require it.


#### Starting

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

#### Scheduler

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


#### Shutdown

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


### Other documentation

Implementation overview: https://github.com/evanx/chronica/blob/master/lib/readme.md
