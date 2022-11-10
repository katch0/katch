import * as fs from 'fs';
import glob from 'glob-promise';

let katchMode = 1;
let lastEvent = null;



let name2collected_method = {}

export const Katch = function(...args) {

   let isClass = args[0] instanceof Function && args[0].toString().match(/^class/);
   if(isClass) {
      current_class = args[0];
      console.log('class', current_class.name);
      class2collected_methods[current_class.name] = name2collected_method;
      name2collected_method = {};
      collected_classes[args[0].name] = args[0];
   }
   let isMethod = args[2] && args[2].value instanceof Function;
   if(isMethod) {
      console.log('class', current_class.name, 'method', args[1]);
      name2collected_method[args[1]] = args[2].value;
   }
   // console.log('before init',args)

};

let object2context = new WeakMap();

Katch.Class = class {
   async fireEvent(event) {
      // нужно почитать всех листенеров и тут же их вызвать
      // (будет использоваться lastEvent, поэтому нужно сделать как-то так, что пока
      // все листенеры одного эвента не вызваны, следущие не вызываются)

      // получить блокировку @todo
      console.log(object2context.get(this).listeners.get(event.constructor))
      for(let [object, method] of object2context.get(this).listeners.get(event.constructor)) {
         // @todo - аргументы
         lastEvent = event;
         try {
            await method.call(object)
         } catch(e) {
            console.log(this, object, method, event);
            // setTimeout(()=>{
            //    eval(`
                  throw e
               // `)
            // }, 0)
         }
         lastEvent = null;
      }
      // снять блокировку @todo
   }
   async fireRequest() {

   }
}
// Katch.EventPoint = function() {
//    return class {}
// }
// Katch.RequestPoint = function() {
//    return class request {}
// }
Katch.context = {}
Katch.context.App = {
   event: {
      App_Inited: class {}
   },
   request: {
      App_Inited: class {}
   }
}
Katch.test = function() {}

Katch.classes = {};

Katch.createContext = function() {

}

Katch.addInstanceToContext = function() {

}

Katch.noop = new class noop {};

let contexts = {
   App:{
      classes: [],
      objects: [],
      listeners: new WeakMap,
   }
};

export class KatchApp extends Katch.Class {
   static event = {
      Init: {['KatchApp.event.Init']:class{}}['KatchApp.event.Init'],
   }
}

let current_class = null;
let collected_classes = {};
let class2collected_methods = {};

if (!module.parent) {
   let init_contexts =
      process.argv.
      map(_=>(
         _.match(/^--init-context=(.*)/) || [])
         [1]
      )
         .filter(_=>_)
         [0]
         .split(',');

   setTimeout(async function() {
      let files = await glob("./**/*.[jt]s", {ignore: '**/node_modules/**'});
      files = files.filter(file => fs.readFileSync(file).toString().match(/@Katch/));
      console.log('files', files);
      for(let file of files) {
         console.log('loading ', file);
         collected_classes = {};
         let module_members = await import(file);

         for(let classname in collected_classes) {
            console.log(classname);
            if(module_members[classname] === collected_classes[classname]) {
               Katch.classes[classname] = module_members[classname];
               for(let i in Katch.classes[classname].event || []) {
                  console.log('ss',classname,i)
                  Katch.classes[classname].event[i] = {[classname + '.event.' + i]: class {}} [classname + '.event.' + i];
               }
               // for(let i in Katch.classes[classname].request || []) {
               //    Katch.classes[classname].event[i] = {[classname + '.request.' + i]: class {}} [classname + '.request.' + i];
               // }
            }
         }




      }

      // здесь - нужно сконструировать класс(ы), которые в контексте

      for(let name of init_contexts) {
         console.log('name', name, Katch.classes[name], Katch.classes)
         let object = Katch.classes[name];
         contexts.App.classes.push(object);
      }

      // инициализировать все зависимые контексты

      let done = false;
      while (!done) {
         done = true;
         for(let classname in Katch.classes) {
            for(let initWith of Katch.classes[classname].initWith || []) {
               if(contexts.App.classes.indexOf(initWith) > -1 && contexts.App.classes.indexOf(Katch.classes[classname]) === -1) {
                  console.log('adding ', classname)
                  contexts.App.classes.push(Katch.classes[classname]);
                  done = false
               }
            }
         }
      }

      console.log('contexts.App',contexts.App)


      for(let _class of [KatchApp, ...contexts.App.classes]) {
         console.log(_class)
         let object = new _class();
         contexts.App.objects.push(object);
         object2context.set(object, contexts.App);
      }


      console.log('contexts.App.objects', contexts.App.objects)


      // запустить все методы помеченные @Katch, чтобы собрать все Katch.event
      //  * получить список всех методов, которые помечены @Katch
      console.log('class2collected_methods',class2collected_methods);

      let promises = [];


      katchMode = 1;
      for(let o of contexts.App.objects) {
         for(let i in class2collected_methods[o.constructor.name]) {
            console.log(o.constructor.name, i)
            parsed_events = [];
            try {
               await o[i]();
            } catch(e) {
               if(e !== Katch.break) {
                  throw e
               }
               // @todo здесь нужно распарсить на какие эвенты была подписка и добавить в listeners
               for(let event of parsed_events) {
                  if(!contexts.App.listeners.has(event)) {
                     contexts.App.listeners.set(event, []);
                  }
                  contexts.App.listeners.get(event).push([o,o[i]]);
               }
               continue
            }
            throw new Error('Katch.event or Katch.request is not defined in method' + o.constructor.name + '.' + i);
         }
      }
      katchMode = 2;

      await contexts.App.objects[0].fireEvent(new KatchApp.event.Init());

   }, process.execArgv.indexOf('--inspect') === -1 ? 0 : 1000);
}

Katch.break = Symbol()

let parsed_events = []

Katch.event = function(...args){
   console.log('Katch.event', katchMode, args);
   if(katchMode === 1) {
      // режим 1 - считываем, какие нужны эвенты
      parsed_events = args;
      // + определяем, какие аргументы были вызваны
      // console.log(...args);
      throw Katch.break
   }

   if(katchMode === 2) {
      // режим 2 - возвращаем текущий эвент (в функцию, которая была вызвана с правильными аргументами)
      return lastEvent;
   }
};

Katch.request = async function(){
   return class {}
};


// console.log(katch);