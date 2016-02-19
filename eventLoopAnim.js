// draw a donat-charts easily
// new Arc(x, y, radius, startAngle, endAngle, antiClockwise)
//

var clientXY    = [ 100, 150 ];
var taskStartXY = clientXY.map(function(pos){ return pos + 50; });
var serverXY    = [ 500, 100 ];
var taskRunXY   = serverXY.map(function(pos){ return pos + 50; });
//var taskDispatchedXY = [ serverXY[0] , serverXY[1] ];
var taskDispatchedXY = [ serverXY[0] + 50 , serverXY[1] + 10];
var taskWaitXY  = [ serverXY[0] + 50 , serverXY[1] + 10];
var taskDoneXY  = [ serverXY[0] + 50, serverXY[1] + 150];
var masterMS    = 20;
var tau         = Math.PI*2;

server = {
  busy : false,
  waiting : [],
  maxThreads : 3,
  curThreads : 0,
  incr : 0,
  run : function(task){
    this.incr++;
    this.curThreads++;
    task.run();
    if(this.curThreads == this.maxThreads){
      this.busy = true;
    }
  },
  load : function(task){
    if(this.busy){
      console.log('busy');
      this.waiting.push(task);
      task.wait(this.waiting.length);
    }else{
      console.log('NOT busy');
      this.run(task);
    }
  },
  unload : function(task){
    if(this.waiting.length){
      console.log('waiting: ' + this.waiting.length);
      this.waiting.map(function(task, idx){
        task.wait(idx);
      });
      setTimeout(function(){
        this.curThreads--;
        this.busy = false;
        this.run(this.waiting.shift());
      }.bind(this), 101);
    }else{
      console.log('waiting stack empty');
      this.curThreads--;
      this.busy = false;
    }
  }
};

var cloud = new Rect(clientXY[0],clientXY[1],100,100)
  .stroke('#f00', 2)
  .addTo(stage);

var serverBox = new Rect(serverXY[0],serverXY[1],100,200)
  .stroke('#f00', 2)
  .addTo(stage);

function Task(color, stepMultiplier, x, y){
  this.stepLength = this.defaultStep * stepMultiplier;
  this.completed = 0;
  this.interval = null;
  this.worktime = (tau / this.stepLength) * masterMS;

  this.circ = new Group()
    .attr('x', taskStartXY[0])
    .attr('y', taskStartXY[1])
    .attr('rotation', Math.PI * 1.5)
    .addTo(stage);

  this.todo = null;
  this.done = null;

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
  this.interval = setInterval(this.step.bind(this), masterMS);
  this.move(taskDoneXY, this.worktime + 'ms');
  console.log('running');
};

Task.prototype.wait = function(placeInLine){
  var position = [taskWaitXY[0], taskWaitXY[1]];
  position[0] = position[0] - 10 * placeInLine;
  console.log(server.waiting.length);
  var sending = this.move(position, '100ms');
};

tools.mixin(Task.prototype, EventEmitter);

Task.prototype.on('queued', function(){
  server.load(this);
});

Task.prototype.on('completed', function(){
  clearInterval(this.interval);
  this.move(taskStartXY)
    .on('end', function(){
      this.circ.destroy();
      delete this;
    }.bind(this));
  server.unload(this);
  this.circ.removeChild(this.todo);
});

/////////

function makeTask(speed){
  switch(true){
    case speed >= 0.8:
      return new Task('green', speed);
    case speed < 0.8 && speed >= 0.5:
      return new Task('blue', speed);
    case speed < 0.5 && speed >= 0.3:
      return new Task('yellow', speed);
    case speed < 0.3 && speed >= 0.1:
      return new Task('orange', speed);
    default:
      return new Task('red', 0.1);
  }
}

var t = new Task('red', 0.5);
t.dispatch();

stage.on('click', function(){
  makeTask(Math.random())
    .dispatch();
});
//t.run();

