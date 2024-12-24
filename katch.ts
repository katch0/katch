import * as fs from 'fs';
const glob = require('glob-promise');

function getAllProperties(obj) {
   let props = new Set();

   while (obj) {
      Object.getOwnPropertyNames(obj).forEach(prop => props.add(prop));
      obj = Object.getPrototypeOf(obj);
   }

   return [...props];
}

function LogClass(target: Function) {
   // Логируем все методы класса (включая статические)
   Object.getOwnPropertyNames(target.prototype).forEach((methodName) => {
      if (methodName === 'constructor') {
         return; // Пропускаем конструктор
      }

      const originalMethod = target.prototype[methodName];

      target.prototype[methodName] = function (...args: any[]) {
         const className = target.name;

         // Получаем стек вызовов для определения строки
         const stack = new Error().stack?.split('\n')[2]; // 2-я строка будет содержать вызов метода
         const lineInfo = stack?.match(/:(\d+):\d+/); // Ищем номер строки в стеке
         const lineNumber = lineInfo ? lineInfo[1] : 'unknown';

         console.log(`\n                [${className}].${methodName}:${lineNumber}\n                ====================`);

         return originalMethod.apply(this, args);
      };
   });

   // Логируем все статические методы
   Object.getOwnPropertyNames(target).forEach((methodName) => {
      if (methodName === 'length' || methodName === 'prototype' || methodName === 'name') {
         return; // Пропускаем специальные свойства класса
      }

      const originalMethod = target[methodName];

      if (typeof originalMethod === 'function') {
         target[methodName] = function (...args: any[]) {
            const className = target.name;

            // Получаем стек вызовов для определения строки
            const stack = new Error().stack?.split('\n')[2]; // 2-я строка будет содержать вызов метода
            const lineInfo = stack?.match(/:(\d+):\d+/); // Ищем номер строки в стеке
            const lineNumber = lineInfo ? lineInfo[1] : 'unknown';

            console.log(`\n                ${className}.${methodName}:${lineNumber}\n                ===================`);

            return originalMethod.apply(this, args);
         };
      }
   });
}


let katchMode = 1;
let lastEvent = null;



let name2collected_method = {}

let collected_tests = [];
let class2collected_tests = {};
let class2decorated_methods = {};
let class2decorated_static_methods = {};

@LogClass
export class KatchContext {

   classes                 = []
   objects                 = []
   listeners_event         = []
   listeners_request       = []
   listeners_requestevent  = []


   ModuleToInit;

   // @todo
   static async initFromCommandLine(init_contexts = undefined) {

      init_contexts = init_contexts ||
         (process.argv.
         map(_=>(
            _.match(/^--init-context=(.*)/) || [])
            [1]
         )
            .filter(_=>_)
            [0] || '')
            .split(',').filter(_=>_);

      let run_tests = false;

      if(process.argv.filter(_=>_ === '--test').length) {
         run_tests = true
      }

      await new Promise(_ => setTimeout(_, process.execArgv.indexOf('--inspect') === -1 ? 0 : 1000));

      await this.scanFilesInDirectory();

      if(run_tests) {
         await this.runTests();
      }

      if(init_contexts.length) {
         contexts.App = new KatchContext();
         await contexts.App.initAllContexts(init_contexts)
         await contexts.App.initAllObjects();
         await contexts.App.scanMethodsAndSubscribe();
         await contexts.App.triggerInitRequestToRunApp();
      }

   }

   static async scanFilesInDirectory() {

      Katch.classes[KatchApp.name] = KatchApp;

      let files = await glob(process.cwd() + "/**/*.ts", {ignore: '**/node_modules/**'});
      files = files.filter(file => fs.readFileSync(file).toString().match(/@Katch/));

      for(let file of files) {

         let module_members = await import(file);

         for(let classname in collected_classes) {
            if(module_members[classname] === collected_classes[classname] || module_members.default[classname] === collected_classes[classname]) {
               Katch.classes[classname] = collected_classes[classname];
            }
         }

      }

      for(let classname in Katch.classes) {
         let current_class = Katch.classes[classname];

         getAllProperties(current_class).map(it => {

            if(it.startsWith('Event_') || it.startsWith('Request_')) {
               let _point_args = (current_class[it]._point_args || [])[0] || current_class[it]();

               current_class[it] = {[current_class.name + '.' + it]: function(..._trigger_args) {
                     let o = this;
                     if(o === current_class) {
                        o = Object.create(current_class[it].prototype)
                     }
                     Object.defineProperties(o, {
                        _trigger_args  : {value: _trigger_args       , enumerable: false},
                        _point_args    : {value: _point_args         , enumerable: false},
                        _trigger_name  : {value: it                  , enumerable: false},
                        _class_name    : {value: current_class.name  , enumerable: false},
                     })
                     Object.assign(o, _trigger_args[0] || {})

                     return o;
                  }}[current_class.name + '.' + it];

               Object.defineProperties(current_class[it], {
                  _point_args    : {value: _point_args         , enumerable: false},
                  _trigger_name  : {value: it                  , enumerable: false},
                  _class_name    : {value: current_class.name  , enumerable: false},
               })

            }

         })

      }

   }

   async initAllContexts(init_contexts) {

      // инициализировать все зависимые контексты
      // let done = false;
      // while (!done) {
      //    done = true;
      //    for(let classname in Katch.classes) {
      //       for(let initWith of Katch.classes[classname].initWith || []) {
      //          if(contexts.App.classes.indexOf(initWith) > -1 && contexts.App.classes.indexOf(Katch.classes[classname]) === -1) {
      //             contexts.App.classes.push(Katch.classes[classname]);
      //             done = false
      //          }
      //       }
      //    }
      // }

      for(let name of init_contexts) {
         // console.log('name', name, Katch.classes[name], Katch.classes)
         let object = Katch.classes[name];
         this.classes.push(object);
         for(let _class of this.classes) {
            let context_classes = Katch.classes[_class.name].context || [];
            for(let _context_class of context_classes) {
               this.classes.push(Katch.classes[_context_class.name]);
            }
         }
      }
   }

   static async runTests() {
      // запустить тесты
      katchMode = 2;
      for(let classname in Katch.classes) {
         for(let test of class2collected_tests[classname]) {

            let ctx = new KatchContext();
            ctx.classes.push(Katch.classes[classname]);
            await ctx.initAllObjects();
            await ctx.scanMethodsAndSubscribe();

            let instance = ctx.objects[0];
            Katch.debug = await instance[test]();

         }
      }
   }

   async initAllObjects() {
      for(let _class of this.classes) {
         // console.log(_class)
         let object = new _class();
         Object.defineProperty(object, 'context',  { value: this, enumerable: false});

         this.objects.push(object);
         object2context.set(object, this);
      }
   }

   // @todo
   async scanMethodsAndSubscribe() {

      katchMode = 1;
      for(let o of this.objects) {
         for(let i of class2decorated_methods[o.constructor.name]) {
            parsed_events = [];
            try {
               await o[Katch.debug = i]();
               throw new Error('the function must have Katch block at the top');
            } catch(e) {
               if(e !== Katch.break) {
                  throw e
               }
               // @todo здесь нужно распарсить на какие эвенты была подписка и добавить в listeners
               let [katch_type, katch_args] = Katch.debug = KatchArgsMode1;
               for(let trigger of katch_args) {

                  Katch.debug = trigger;

                  // if(!(trigger instanceof _)) {
                  //    trigger = _(trigger)
                  // }

                  let filter = trigger;

                  let listeners = this[`listeners_${katch_type}`]

                  Katch.debug = filter.type;

                  if(!listeners[filter._class_name + '.' + filter._trigger_name]) {
                     listeners[filter._class_name + '.' + filter._trigger_name] = [];
                  }
                  listeners[filter._class_name + '.' + filter._trigger_name].push([o,i, filter]);
               }
               continue
            }
            throw new Error('Katch.event or Katch.request is not defined in method' + o.constructor.name + '.' + i);
         }
      }
      katchMode = 2;

      Katch.debug = this.listeners_event;
      Katch.debug = this.listeners_request;
      Katch.debug = this.listeners_requestevent;
   }

   // @todo
   async triggerInitRequestToRunApp() {

      Katch.debug = this.objects;

      await this.objects[0].fireRequest(this.classes[0].Request_Init());
      await this.objects[0].fireEvent  (this.classes[0].Event_Inited());

   }
}

let methodIsDecorated = new WeakMap();

let KatchArgsMode1 = [];

export const Katch = function(...args) {

   if(args[1]?.kind || args?.[2]?.value) {
      // decorator mode

      if(args?.[2]?.value) {
         throw `Experimental decorators are not implemented`;
      }

      if(args[1]?.kind === 'class') {
         current_class = args[0];

         class2decorated_methods[current_class.name] = Object.getOwnPropertyNames(current_class.prototype)
            .filter(name=> {
               if(name === 'constructor') {
                  return;
               }
               let method = current_class.prototype[name];
               if(method.toString().match('Katch.Event') || method.toString().match('Katch.Request')) {
                  console.log('decorated method', name, method.toString());
                  return true
               }
            });
            // .filter(name=>methodIsDecorated.get(current_class.prototype[name]));

         class2decorated_static_methods[current_class.name] = Object.getOwnPropertyNames(current_class)
            .filter(name=>methodIsDecorated.get(current_class[name]));

         class2collected_tests[Katch.debug = current_class.name] = Katch.debug = Object.getOwnPropertyNames(current_class.prototype)
            .filter(name=> name.startsWith("test_class_"));
         // name2collected_method = {};
         collected_tests = [];
         collected_classes[args[0].name] = args[0];

      }

      // if(args[1]?.kind === 'method' && !args[1]?.static) {
      //    methodIsDecorated.set(args[0], true);
      // }
      //
      // if(args[1]?.kind === 'method' && args[1]?.static) {
      //    methodIsDecorated.set(args[0], true);
      // }


   } else {
      if(katchMode === 1) {
         KatchArgsMode1 = args;
         throw Katch.break;
      } else if(katchMode === 2) {
         throw new Error('Deprecated');
         return Katch.current_fire
      } else {
         throw `unknown katchMode ${katchMode}`
      }

   }

};

let object2context = new WeakMap();

Katch.current_fires = [];

Katch.context = (o) => {
   return object2context.get(o);
}

Katch.Request = function(...args) {
   if(katchMode === 1) {
      KatchArgsMode1 = ['request', args]
      throw Katch.break
   }

   if(katchMode === 2) {
      return Katch.current_fire
   }
}

Katch.Event = function(...args) {
   if(katchMode === 1) {
      KatchArgsMode1 = ['event', args]
      throw Katch.break
   }

   if(katchMode === 2) {
      return Katch.current_fire
   }
}

Katch.RequestEvent = function(...args) {
   if(katchMode === 1) {
      KatchArgsMode1 = ['requestevent', args]
      throw Katch.break
   }

   if(katchMode === 2) {
      return Katch.current_fire
   }

}

Katch.current_request_handler_ready = false;
Katch.current_request_handler_continue = new Promise(()=>{});
Katch.current_request_handler_prio = 10;

Katch.requestHandlerReady = function({prio = 10} = {}) {
   Katch.current_request_handler_ready = true;
   Katch.current_request_handler_prio = prio;
   return Katch.current_request_handler_continue;
}

Katch.Class = class {
   context = {}

   async fireEvent(event) {


      let currentClass = this.constructor;
      let _trigger_name = event._trigger_name || event.constructor._trigger_name

      while(currentClass) {
         if(currentClass.hasOwnProperty(_trigger_name)) {
            let triggerName = Katch.debug = currentClass.name + '.' + _trigger_name;
            for(let [object, method, filter] of Katch.debug = this.context.listeners_event[triggerName] || []) {

               console.log('checking filter', filter, event)
               if(filter.check && !filter.check(event)) {
                  continue;
               }
               console.log('filter passed');

               if(Katch.current_fire) {
                  Katch.current_fires.push(Katch.current_fire);
               }

               Katch.current_fire = event;

               // Promise.allSettled()
               try {
                  object[method]();
               } catch(e) {
                  console.log(e && e.stack || e, this, object, method, event);
               }

               Katch.current_fire = Katch.current_fires.pop();
            }
         }
         currentClass = Object.getPrototypeOf(currentClass);
      }

   }

   async fireRequest(request) {

      /*
         @todo
         тут надо запустить с await и дождаться, когда будет Katch.apply() или Katch.reject()


       */




      Katch.debug = request;
      Katch.debug = this.context.listeners_request;

      let currentClass = this.constructor;
      let event = request;
      let _trigger_name = event._trigger_name || event.constructor._trigger_name

      let async_handlers_queue = [];

      while(Katch.debug = currentClass) {
         if(currentClass.hasOwnProperty(_trigger_name)) {
            let triggerName = Katch.debug = currentClass.name + '.' + _trigger_name;
            for(let [object, method, filter] of this.context.listeners_request[triggerName] || []) {

               if(filter.check && !filter.check(request)) {
                  console.log('checking', filter, request)
                  continue;
               }

               if(Katch.current_fire) {
                  Katch.current_fires.push(Katch.current_fire);
               }

               Katch.current_fire = event;

               // Promise.allSettled()
               let continue_fn;
               try {
                  Katch.current_request_handler_continue = new Promise(r=>{continue_fn = r})
                  Katch.current_request_handler_ready = false
                  Katch.current_request_handler_prio = 10;
                  object[method]();
               } catch(e) {
                  console.log(e && e.stack || e, this, object, method, event);
               }
               if(Katch.current_request_handler_ready) {
                  async_handlers_queue.push({prio: Katch.current_request_handler_prio, continue_fn})
               }

               Katch.current_fire = Katch.current_fires.pop();
            }
         }
         currentClass = Object.getPrototypeOf(currentClass);
      }

      async_handlers_queue.sort((a,b)=>a.prio - b.prio)

      for(let it of Katch.debug = async_handlers_queue) {
         let result = await it.continue_fn();
         if(typeof result !== undefined) {
            return result
         }
      }

   }


   async fireRequestEvent(request) {



      /*
         тут надо запустить с await и дождаться, когда будет Katch.apply() или Katch.reject()


       */

      Katch.debug = this.context.listeners;

      throw new Error("Not implemented")


   }

}
// Katch.EventPoint = function() {
//    return class {}
// }
// Katch.RequestPoint = function() {
//    return class request {}
// }

// Katch.test = function(...args) {
//    collected_tests.push(args[2].value);
// }


Katch.createContext = function() {

}

Katch.addInstanceToContext = function() {

}

Katch.emit = function() {

}

Katch.noop = new class noop {};

Object.defineProperty(Katch, 'debug',{ set(value){ console.log(new Error().stack.split("\n")[2].match(/[^\s/:]+:[0-9]+:[0-9]+/)[0] + ' =', value)} } )
Object.defineProperty(Katch, 'debugger',{ set(value){ console.log(new Error().stack.split("\n")[2].match(/[^\s/:]+:[0-9]+:[0-9]+/)[0] + ' =', value); debugger} } )

let contexts = {
   // App: {
   //    classes: [],
   //    objects: [],
   //    listeners_event: [],
   //    listeners_request: [],
   //    listeners_requestevent: [],
   // }
   // App: new KatchContext()
};

Katch.EventPoint = Katch.RequestPoint = (..._point_args) => {
   return (...args)=>[_point_args, args]
}


let current_class = null;
let collected_classes = {};
let class2collected_methods = {};

Katch.classes = {}

Katch.break = Symbol()

/*
нужны в местах:
- декларировать эвенты
- при парсинге определять, что был декларирован эвент (можно через префикс)
- при генерации события и его отправке
- при "нацеливании" на эвент
- при отправке функции
 */

let parsed_events = []

@Katch
export class KatchApp extends Katch.Class {
   static Request_Init = Katch.RequestPoint({});
   static Event_Inited = Katch.EventPoint({});
   static context = [];
}

if (!module.parent)  {
   KatchContext.initFromCommandLine()
}

export function _(type, params = {}) {

   if(!(this instanceof _)) {
      // @ts-ignore
      return new _(type, params)
   }

   this.type = type
   this.params = params

   Object.defineProperty(this, "check", {enumerable: false, writable: true});

   this.check = function(o) {
      Katch.debug = o
      for(let i in params) {
         if(o[i] !== params[i]) {
            return false
         }
      }
      return true
   }

   console.warn('underscore substitute operator _ is partially implemented')
}

Object.defineProperty(Katch, 'test_method'      , {get(){ return 'test_method_'      + Math.random().toString(36).substring(2) }, enumerable: false})
Object.defineProperty(Katch, 'test_class'       , {get(){ return 'test_class_'       + Math.random().toString(36).substring(2) }, enumerable: false})
Object.defineProperty(Katch, 'test_integration' , {get(){ return 'test_integration_' + Math.random().toString(36).substring(2) }, enumerable: false})
Object.defineProperty(Katch, 'test_system'      , {get(){ return 'test_system_'      + Math.random().toString(36).substring(2) }, enumerable: false})

// console.log(katch);