// draw a donat-charts easily
// new Arc(x, y, radius, startAngle, endAngle, antiClockwise)
//

var clientXY = [ 100, 150 ];
var taskStartXY = clientXY.map(function(pos){ return pos + 50; });
var serverXY = [ 500, 100 ];
var taskRunXY= serverXY.map(function(pos){ return pos + 50; });
var taskWaitXY= [ serverXY[0] + 50, serverXY[1] - 50];
var taskDoneXY= [ serverXY[0] + 50, serverXY[1] + 150];
var masterMS = 30;
var tau = Math.PI*2;

server = {
  busy : false,
  waiting : 0,
  maxThreads : 10,
  curThreads : 0,
  incr : 0,
  plus : function(){
    this.incr++;
    this.curThreads++;
    if(curThreads == maxThreads){
      this.busy = true;
    }
  },
  minus : function(){
    this.curThreads--;
    this.busy = false;
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
  console.log(this.worktime);

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
  speed = speed || '2s';
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
    this.finished();
  }
};

Task.prototype.dispatch = function(){
  var sending = this.move(taskRunXY);
  sending.on('end',this.run.bind(this));
  sending.on('end',this.move.bind(this, taskDoneXY, this.worktime + 'ms'));
};

Task.prototype.run = function run() {
  this.interval = setInterval(this.step.bind(this), masterMS);
  console.log('running');
};

Task.prototype.finished = function finished() {
  clearInterval(this.interval);
  this.circ.removeChild(this.todo);
  console.log('done');
};

/////////

var t = new Task('red', 0.5);
t.dispatch();
//t.run();
