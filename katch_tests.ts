
import {katch, Katch, KatchApp} from './katch';


@Katch
export class KatchTests extends Katch.Class {

   static event = {
      TestEvent1: class event {},
      TestEvent2: class event {},
   }

   @Katch
   async initApp() {
      Katch.event(KatchApp.event.Init);

      console.log('hello from ' + __filename);

      await this.fireEvent(new KatchTests.event.TestEvent1());

   }

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




}
