
import {_, Katch} from './katch';

@Katch
export class KatchTests extends Katch.Class {

   static Event_Test1 = Katch.EventPoint({ a:_, b:_ })
   static Event_Test2 = Katch.EventPoint({ b:_, c:_ })
   static Event_Test3 = Katch.EventPoint({ b:_, c:_ })
   static Event_Test4 = Katch.EventPoint({ b:_, c:_ })
   static Event_Test5 = Katch.EventPoint({ b:_, c:_ })

   // async initApp() {
   //    Katch.debug = Katch.Request(KatchTests.Request_Init);
   //
   //    await Katch.requestHandlerReady({prio: 2});
   //
   //    console.log('hello from ' + __filename);
   //
   //    await this.fireEvent(Katch.debug = KatchTests.Event_Test1);
   //    await this.fireEvent(KatchTests.Event_Test1({a:2, b:2}));
   //    await this.fireEvent(KatchTests.Event_Test1({b:3}));
   //
   // }
   //
   // async catchEvent() {
   //    Katch.debug = Katch.Event(KatchTests.Event_Test1({a:2}));
   //
   //
   // }
   //
   // async catchEventSubstitute() {
   //    Katch.debug = Katch.Event(_(KatchTests.Event_Test1, {a:2}), _(KatchTests.Event_Test1, {b:3}));
   //
   //
   // }

   // @Katch.test
   // async () {
   //
   // }

   // @Katch
   // @Katch.test(() => {
   //
   // })
   // async runApp() {
   //    await Katch.event(.event.Inited);
   //
   //
   // }


   async testCatch() {
      Katch.Event(
         KatchTests.Event_Test1(),
      )

   }

   async testCatch() {
      Katch.Event(
         KatchTests.Event_Test1(),
      )
   }

   async testPatternMatching(a) {
      Katch.Event(
         KatchTests.Event_Test2({a:_(a, 2)}),
      )

      this.caught2_a = a;
   }

   async [Katch.test_class](Test) {

      this.fireEvent(KatchTests.Event_Test1({a:1, b:3}));
      this.fireEvent(KatchTests.Event_Test1({a:7, b:3}));

   }

   async [Katch.test_class](Test) {

      this.fireEvent(KatchTests.Event_Test1({a:1, b:3}));
      this.fireEvent(KatchTests.Event_Test1({a:7, b:3}));

   }

   // async [Katch.test_integration(Logger)]() {
   //
   //    this.fireEvent(KatchTests.Event_Test1({a:2, b:3}));
   //
   // }
   //



}
