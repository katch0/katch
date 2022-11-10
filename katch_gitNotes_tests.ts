const util = require('util');
const exec = util.promisify(require('child_process').exec);
import {Katch} from './katch';

@Katch
export class GitNotesConsumer {

   static request = {
      Save: class{},
   }

}

@Katch
export class GitNotes extends Katch.Class {

   static event = {
      File_Updated: class{},
   }

   @Katch
   async saveFile(user, filename, contents, hash) {

      await Katch.request(
         GitNotesConsumer.request.save({
            user     : Katch._(user),
            filename : Katch._(filename),
            contents : Katch._(contents),
            hash     : Katch._(hash),
         })
      );

      /*

         cd tmp
         git checkout $hash
         save file
         git commit
         git log -1 => $new_hash
         git checkout master
         git merge $new_hash

       */
      const { stdout, stderr } = await exec(`
      bash -c '
      cd gitNotesTmp; 
      
      '`);


      Katch.emit(KatchGitNotesTests.event.VersionSaved)

   }

   @Katch
   async getFile(user, filename) {

      await Katch.request(
         KatchGitNotesTests.request.get({
            user     : Katch._(user),
            filename : Katch._(filename),
         })
      );

      /*

         cd tmp
         git checkout $hash
         save file
         git commit
         git log -1 => $new_hash
         git checkout master
         git merge $new_hash

       */
      const { stdout, stderr } = await exec(`
      bash -c '
      cd gitNotesTmp; 
      
      '`);


      Katch.emit(KatchGitNotesTests.event.VersionSaved)

   }

   @Katch.test
   async test(instance, test) {
      let {commit1} = await instance.saveNote("okneigres@gmail.com", "day-2020-02-02", "AAA", "");
      let {commit2} = await instance.saveNote("okneigres@gmail.com", "day-2020-02-02", "BBB", commit1);

      let {contents} = await instance.getNote("okneigres@gmail.com", "day-2020-02-02")

      Katch.emit(KatchGitNotesTests.request.save({
         user     : {},
         filename : {},
         contents : {},
         hash     : {},
      }))

   }

}
