# katch – static event-oriented application glue

```
import {Katch} from 'katch';

@Katch
class cat {
  static event() {
    cat.event.bited     = Katch.event();
    cat.event.murred    = Katch.event();
  }
  static request() {
    cat.request.food    = Katch.request();
  }

  @Katch
  make_mur() {
    katch(human.event.touchedCat, {Human: this.Owner});
    console.log('Cat: mur');
    
  }
  
  @Katch
  make_bite() {
    let [, {Human}] = katch(human.event.touchedCat, {Human: $ => $ !== this.Owner }, );
    console.log('Cat bite', Human);
  }

  @Katch
  murring(process) {
    this.make_mur();
    
  }
  
}

@Katch
class human {
  
  @Katch
  pet() {
    katch(cat.event.murred);
    console.log('Human: *pet cat');
  }
  
  @Katch
  test_in_context() {
    katch(apartment.cat.)
  }
  
}


export {cat, human};
```

run it using shell command:

```
node -r ts-node/register/transpile-only --nolazy --inspect katch.ts --init-context=cat,human,scene
```
