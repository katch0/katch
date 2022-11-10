
import {Katch, KatchApp} from './katch';
import {KatchTests} from './katch_tests';


@Katch
export class KatchTests2 extends Katch.Class {

   static initWith = [KatchTests];

   @Katch
   async testKatch() {
      let event = Katch.event(KatchTests.event.TestEvent1);
      console.log(__filename, event, this);

   }
}
