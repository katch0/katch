module.exports.katch = function(target){
  console.log('katch', target);
};

module.exports.katch = function(target){
  if(target instanceof Function) {
    const Class = target;
    if(Class.request) {
      Class.request();
    }
    if(Class.event) {
      Class.event();
    }
    console.log('katch', target);
  }
};
