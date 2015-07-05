
### ComponentFactory

We instantiate components via `ComponentFactory.`

Components have the following lifecycle methods:
- `start`
- `end`
- `scheduledTimeout`
- `scheduledInterval`

For example:

```javascript
   async start() {
      logger.info('started');
   },
   async scheduledTimeout() {
      logger.info('scheduledTimeout')
   },
   async scheduledInterval() {
      logger.info('scheduledInterval')
   },
   async end() {
      logger.info('end');
   },
```

The scheduled methods are optional. Their intervals can be specified in their config:

```yaml
scheduledTimeout: 8000 # invoke 8 seconds after start
scheduledInterval: 45000 # invoke every 45 seconds
```

`ComponentFactory` decorates their config using defaults from YAML files, and invokes the component's exported `create` method. The following example is an ExpressJS server:

```javascript
export function create(config, logger, components, state) {

   let app, server, listening;

   const those = {
      get state() {
         return { config, listening };
      },
      async start() {
         app = express();
         logger.info('listening', config.port);
         app.get(config.location, async (req, res) => {
            res.json(those.state);
         });
      },
      async end() {
         if (server) {
            server.close();
         } else {
            logger.warn('end');
         }
      },
   };

   return those;
}
```
where the `state` method is for introspection to assist with debugging.

#### Booting

We create the factory using our configuration loaded from `~/etc/chronica.yaml` or another config file specified on the command-line.

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

Besides its `start()` and `end()` lifecycle methods, a component can define `scheduledTimeout()` and `scheduleInterval()` methods. These are configured as follows:



We schedule a timeout and interval on components, if configured, as follows:
```javascript
function schedule() {
   for (let [name, config] of state.configs) {
      if (config.scheduledTimeout) {
         state.scheduledTimeouts.set(name, setTimeout(() => {
            try {
               state.processors[name].scheduledTimeout();
            } catch (err) {
               logger.warn('scheduledTimeout', name, err);
            }
         }, config.scheduledTimeout));
      }
      let scheduledInterval = config.scheduledInterval;
      if (scheduledInterval) {
         state.scheduledIntervals.set(name, setInterval(() => {
            try {
               state.processors[name].scheduledInterval();
            } catch (err) {
               logger.warn('scheduledTimeout', name, err);
            }
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
         logger.warn('end', name);
```
where we timeout the components' `end()` async functions.

See: https://github.com/evanx/chronica/blob/master/lib/ComponentFactory.js


### Other documentation

Implementation overview: https://github.com/evanx/chronica/blob/master/lib/readme.md
