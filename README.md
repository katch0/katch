# katch – static event-oriented application glue

```
import {katch, app} from 'katch';

class cat {
  static event() {
    cat.event.bited     = katch.event();
    cat.event.murred    = katch.event();
  }
  static request() {
    cat.request.food    = katch.request();
  }
  make_mur() {
    katch(human.event.touchedCat, {Human: this.Owner});
    console.log('Cat: mur');
    
  }
  make_bite() {
    let [, {Human}] = katch(human.event.touchedCat, {Human: $ => $ !== this.Owner }, );
    console.log('Cat bite', Human);
  }
  murring(process) {
    this.make_mur();
    
  }
  
}

class human {
  
  pet() {
    katch(cat.event.murred);
    console.log('Human: *pet cat');
  }
  
  test_in_context() {
    katch(apartment.cat.)
  }
  
}


class scene {
  
  static init() {
    katch(app.request.init);
  
    var Human = new human();
    var Cat   = new cat();
  
    Cat.event.murred();
  
  }
  
}

export {cat, human, setting};
```
