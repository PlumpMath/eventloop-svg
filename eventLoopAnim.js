// draw a donat-charts easily
// new Arc(x, y, radius, startAngle, endAngle, antiClockwise)
//
var conf = stage.options.conf
    .replace('?','').split('&')
    .map(function(str){ return str.split('='); })
    .reduce(function(conf, tuple){ conf[tuple[0]] = tuple[1]; return conf; }, {});
console.log(conf);

var clientXY    = [ 100, 150 ];
var taskStartXY = clientXY.map(function(pos){ return pos + 50; });
var serverXY    = [ 500, 100 ];
var lightsXY    = [ serverXY[0] + 90, serverXY[1] + 190 ];
var taskRunXY   = serverXY.map(function(pos){ return pos + 50; });
//var taskDispatchedXY = [ serverXY[0] , serverXY[1] ];
var taskDispatchedXY = [ serverXY[0] + 50 , serverXY[1] + 10];
var taskWaitXY  = [ serverXY[0] + 50 , serverXY[1] + 10];
var taskDoneXY  = [ serverXY[0] + 50, serverXY[1] + 150];
var masterMS    = 10;
var tau         = Math.PI*2;

server = {
  busy : false,
  blocked : false,
  waiting : [],
  async : conf.hasOwnProperty('async') ? true : false,
  maxThreads : conf.hasOwnProperty('async') ? 999 : Number(conf.maxThreads) || 1,
  curThreads : 0,
  processed : 0,
  lights : [],     //will hold Circle shape objects
  responseTimes : [],
  run : function(task){
    if(!task) return;
    this.curThreads++;
    this.updateLights();
    task.run();
    if(this.async){
      if(task.sync){
        this.blocked = true;
      }else{
      }
    }
    if(this.curThreads == this.maxThreads){
      this.busy = true;
    }
  },
  load : function(task){
    if(this.busy || this.blocked){
      this.waiting.push(task);
      task.wait(this.waiting.length - 1);
    }else{
      this.run(task);
    }
  },
  unload : function(task){
    this.processed++;
    this.updateLabels(task.responseMS, this.processed);
    this.curThreads--;
    this.updateLights();
    if(this.waiting.length){
      this.waiting.map(function(task, idx){
        task.wait(idx);
      });
      setTimeout(function(){
        this.busy = false;
        this.run(this.waiting.shift());
      }.bind(this), 101);
    }else{
      console.log('waiting stack empty');
      this.busy = false;
    }
  },
  updateLights : function(){
    this.lights.map(function(light, idx){
      if(this.curThreads > idx){
        light.fill('#F00');
      }else{
        light.fill('#000');
      }
    }.bind(this));
  },
  updateLabels : function(time, processed){
    this.responseTimes.push(time);
    var responseTotals = this.responseTimes.reduce(
      function(sum, cur) { return sum + cur; }
    );
    var responseAvg = responseTotals / this.responseTimes.length;
    this.timeText.attr('text', 'Average Response Time: '
        + Math.floor(responseAvg.toString())
        + 'ms');
    this.countText.attr('text', 'Tasks Processed: ' + processed);
  }
};

function initStage(){
  var cloud = new Rect(clientXY[0],clientXY[1],100,100)
    .stroke('#f00', 2)
    .addTo(stage);

  var serverBox = new Rect(serverXY[0],serverXY[1],100,200)
    .stroke('#f00', 2)
    .addTo(stage);

  if(!conf.async){
    for(i = 0; i < server.maxThreads; i++){
      server.lights.push(
        new Circle(lightsXY[0], lightsXY[1] - 10 * i, 3)
          .stroke('#000', 2)
          .fill('#000')
          .addTo(stage)
      );
    }
  }
  server.timeText = new Text('Average Response Time: ').addTo(stage).attr({
    fontFamily: 'Arial, sans-serif',
    fontSize: '20',
    textStrokeColor: 'black',
    x : 100,
    y : 50
  });

  server.countText = new Text('Tasks Processed: ').addTo(stage).attr({
    fontFamily: 'Arial, sans-serif',
    fontSize: '20',
    textStrokeColor: 'black',
    x : 100,
    y : 80
  });
}

function Task(color, stepMultiplier, sync){
  this.stepLength = this.defaultStep * stepMultiplier;
  this.worktime = (tau / this.stepLength) * masterMS;
  this.sync = sync;

  this.completed = 0;
  this.interval = null;

  this.circ = new Group()
    .attr('x', taskStartXY[0])
    .attr('y', taskStartXY[1])
    .attr('rotation', Math.PI * 1.5)
    .addTo(stage);

  if(server.async && !sync){
    this.strokeWidth = 10;
    this.radius = 15;
    var innerBorder = new Circle(0, 0, 10)
      .stroke('#000', 2)
      .addTo(this.circ);
  }

  if(server.async && sync){
    var border = new Circle(0, 0, 20)
      .stroke('#F00', 3)
      .addTo(this.circ);
  }else{
    var border = new Circle(0, 0, 20)
      .stroke('#000', 2)
      .addTo(this.circ);
  }

  //shapes:
  this.todo = null;
  this.done = null;

  //state:
  this.paused = false;

  this.doneAttr = {
    strokeWidth: this.strokeWidth,
    strokeColor: bonsai.color(color)
  };
  this.todoAttr = {
    strokeWidth: this.strokeWidth,
    strokeColor: bonsai.color(color).lighter(0.3)
  };

  this.drawTodo();
}

Task.prototype.defaultStep = 0.1;
Task.prototype.strokeWidth = 20;
Task.prototype.radius = 10;

Task.prototype.drawTodo = function drawTodo(){
  this.circ.removeChild(this.todo);
  this.todo = new Arc(0, 0, this.radius, 0, this.completed, 1).attr(this.todoAttr);
  this.circ.addChild(this.todo);
};

Task.prototype.move = function(coords,speed){
  speed = speed || '1s';
  var ani= new Animation(speed, { x : coords[0] , y : coords[1] });
  this.circ.animate(ani);
  return ani;
};

Task.prototype.drawDone = function drawDone(){
  this.circ.removeChild(this.done);
  this.done = new Arc(0, 0, this.radius, 0, this.completed, 0).attr(this.doneAttr);
  this.circ.addChild(this.done);
};

Task.prototype.step = function step() {
  this.completed += this.stepLength;
  this.drawTodo();
  this.drawDone();
  if (this.completed >= tau) {
    this.emit('completed');
  }
};

Task.prototype.dispatch = function(){
  var sending = this.move(taskDispatchedXY);
  sending.on('end',this.emit.bind(this, 'queued'));
};

Task.prototype.run = function run() {
  this.paused = false;
  this.interval = setInterval(this.step.bind(this), masterMS);
  this.move(taskDoneXY, this.worktime + 'ms');
  console.log('running');
};

Task.prototype.pause = function pause(){
  this.paused = true;
  clearInterval(this.interval);
};

Task.prototype.wait = function(placeInLine){
  var position = [taskWaitXY[0], taskWaitXY[1]];
  position[0] = position[0] - 10 * placeInLine;
  var sending = this.move(position, '100ms');
};

Task.prototype.attemptResponse = function attemptResponse(){
  if(!server.blocked){
    this.responseMS = Date.now() - this.queueTime;
    this.move(taskStartXY)
      .on('end', function(){
        this.circ.destroy();
        delete this;
      }.bind(this));
    server.unload(this);
    this.circ.removeChild(this.todo);
  }else{
    setTimeout(this.attemptResponse.bind(this), 1);
  }
};


tools.mixin(Task.prototype, EventEmitter);

Task.prototype.on('queued', function(){
  server.load(this);
  this.queueTime = Date.now();
});

Task.prototype.on('completed', function(){
  //check if it was a blocking async task & unblock if so
  if(server.blocked && this.sync){
    server.blocked = false;
  }
  clearInterval(this.interval);
  this.attemptResponse();
});

/////////

function makeTask(speed, sync){
  switch(true){
    case speed >= 0.8:
      return new Task('green', speed, sync);
    case speed < 0.8 && speed >= 0.5:
      return new Task('blue', speed, sync);
    case speed < 0.5 && speed >= 0.3:
      return new Task('purple', speed, sync);
    case speed < 0.3 && speed >= 0.1:
      return new Task('orange', speed, sync);
    default:
      return new Task('red', 0.1, sync);
  }
}

//
initStage();
stage.on('click', function(){
  makeTask(Math.random())
    .dispatch();
});

stage.on('key', function(e) {
  if(e.keyCode == 32){ //spacebar
    makeTask(.09, true).dispatch();
  }
});
