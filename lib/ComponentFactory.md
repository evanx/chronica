
### ComponentFactory

We instantiate components via `ComponentFactory.`

#### Configuration

We read the custom configuration file to boot e.g. `~/.chronica.yaml`

https://github.com/evanx/chronica/blob/master/etc/sample-config.yaml

and decorate this with `ComponentFactory.yaml` defaults:

https://github.com/evanx/chronica/blob/master/lib/ComponentFactory.yaml

and finally with the components own default YAML file e.g. `components/expressServer.yaml`


#### Lifecycle

Components have the following lifecycle methods:
- `start`
- `end`
- `scheduledTimeout`
- `scheduledInterval`

The scheduled methods are only required if their intervals are specified in the component's config, for example:

```yaml
scheduledTimeout: 8000 # invoke 8 seconds after start
scheduledInterval: 45000 # invoke every 45 seconds
```

### ExpressJS example

The `ComponentFactory` provides the component with the following:
- its configuration, which is decorated with defaults and asserted
- a logger configured with its name
- the other components it requires e.g. `reporter` requires the `alerter` singleton.
- the context containing required dependencies e.g. other components and "stores"

The following example is an ExpressJS server:

```javascript
export function create(config, logger, context) {
   let app, server;
   const state = { config }; // component state

   const those = { // exported functions including lifecycle
      get state() {
         return state;
      },
      async start() {
         app = express();
         app.get(config.location, async (req, res) => {
            res.json(those.state);
         });
         server = app.listen(config.port);
         state.hostname = context.stores.environment.hostname;
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

The readable `state` property is for introspection to assist with debugging.

<img src='https://raw.githubusercontent.com/evanx/evanx.github.io/master/images/chronica/chronica-express.png' width=700 alt=''/>

---

#### Booting

We create the factory using our configuration loaded from `~/.chronica.yaml` or another config file specified on the command-line.

```javascript
export async function create(rootConfig) {

   async function init() {
      await createStores();
      await initComponents();
      await resolveRequiredComponents();
      await startComponents();
      await schedule();
```

We initialise the configured components:
```javascript
async function initComponents() {
   state.componentNames = getComponentNames();
   return await* state.componentNames.map(async (name) => {
      let config = getComponentDefaultConfig(name);
      let componentClassFile = getClassFile('component', name, config);
      config = await YamlDecorator.decorateClass(componentClassFile, config);
      return await startComponent(name, config, componentClassFile);
   });
}
```
where we decorate the component configuration using a further individual default configuration which be specified for each component e.g. `components/alerter.yaml.` Therefore having the default configuration in `ComponentFactory.yaml` is optional.

The priority of configuration for each component is:
- its section in the custom config e.g. `~/.chronica.yaml`
- its section in `lib/ComponentFactory.yaml`
- its own YAML file e.g. `component/alerter.yaml`

If the component is not specified in `~/.chronica.yaml` then it will not started - nor any components that require it.

Once all the components' `requireComponents` are resolved, they are initialised via their `create` methods, and then finally started.

#### Starting

If all components are created without error, then we start the components via their `start` lifecycle method.

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

Besides its `start()` and `end()` lifecycle methods, a component can define `scheduledTimeout()` and `scheduleInterval()` methods. If configured, these are activated as follows:

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


### Other resources

Redex utils git submodule: https://github.com/evanx/redexutil

Builtin components implementation:
https://github.com/evanx/chronica/blob/master/components/

See our other project which has a similar component model, but for communating sequential processors (CSP):
http://github.com/evanx/redex


### Other documentation

Implementation overview: https://github.com/evanx/chronica/blob/master/lib/readme.md
